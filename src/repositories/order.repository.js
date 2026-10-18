const ManufacturingOrder = require("../models/ManufacturingOrder.model");

const populateOrder = (query) =>
  query
    .populate("product", "reference name")
    .populate("assignedTo", "name email");

const buildQuery = ({ status, product, assignedTo, from, to }) => {
  const query = {};

  if (status) query.status = status;
  if (product) query.product = product;
  if (assignedTo) query.assignedTo = assignedTo;

  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = from;
    if (to) query.createdAt.$lte = to;
  }

  return query;
};

const create = async (data, session) => {
  const [order] = await ManufacturingOrder.create([data], { session });
  return order;
};

const findById = (id, session) =>
  populateOrder(ManufacturingOrder.findById(id).session(session || null));

const updateById = (id, data, session, extraFilter = {}) =>
  populateOrder(
    ManufacturingOrder.findOneAndUpdate(
      { _id: id, ...extraFilter },
      { $set: data },
      { new: true, runValidators: true, session },
    ),
  );

const findAll = async (
  filters,
  { skip, limit, sort = { createdAt: -1 } },
  session,
) => {
  const query = buildQuery(filters);

  const [items, total] = await Promise.all([
    populateOrder(
      ManufacturingOrder.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .session(session || null),
    ),
    ManufacturingOrder.countDocuments(query).session(session || null),
  ]);

  return { items, total };
};


const transitionStatus = (id, fromStatus, data, session) =>
  ManufacturingOrder.findOneAndUpdate(
    { _id: id, status: fromStatus },
    { $set: data },
    { new: true, session },
  );

module.exports = { create, findById, updateById, findAll, transitionStatus };
