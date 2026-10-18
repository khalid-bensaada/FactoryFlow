const RawMaterial = require("../models/RawMaterial.model");

const create = async (data, session) => {
  const [material] = await RawMaterial.create([data], { session });
  return material;
};

const findById = (id, session) =>
  RawMaterial.findById(id).session(session || null);

const findByReference = (reference, session) =>
  RawMaterial.findOne({ reference }).session(session || null);

const findAll = async ({ skip, limit }, session) => {
  const [items, total] = await Promise.all([
    RawMaterial.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .session(session || null),
    RawMaterial.countDocuments().session(session || null),
  ]);
  return { items, total };
};

const findBelowThreshold = async ({ skip, limit }, session) => {
  const filter = { $expr: { $lte: ["$quantity", "$alertThreshold"] } };
  const [items, total] = await Promise.all([
    RawMaterial.find(filter)
      .sort({ quantity: 1 })
      .skip(skip)
      .limit(limit)
      .session(session || null),
    RawMaterial.countDocuments(filter).session(session || null),
  ]);
  return { items, total };
};

const updateById = (id, data, session) =>
  RawMaterial.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true, session },
  );

const incrementQuantity = (id, amount, session) =>
  RawMaterial.findByIdAndUpdate(
    id,
    { $inc: { quantity: amount } },
    { new: true, session },
  );

const findManyByIds = (ids, session) =>
  RawMaterial.find({ _id: { $in: ids } }).session(session || null);

const decrementIfEnough = (id, amount, session) =>
  RawMaterial.findOneAndUpdate(
    { _id: id, quantity: { $gte: amount } },
    { $inc: { quantity: -amount } },
    { new: true, session }
  );

module.exports = {
  create,
  findById,
  findByReference,
  findAll,
  findBelowThreshold,
  updateById,
  incrementQuantity,
  findManyByIds,
  decrementIfEnough,
};
