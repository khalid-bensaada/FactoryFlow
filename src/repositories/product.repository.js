const Product = require("../models/Product.model");

const create = async (data, session) => {
  const [product] = await Product.create([data], { session });
  return product;
};

const findById = (id, session) => Product.findById(id).session(session || null);

const findByIdPopulated = (id, session) =>
  Product.findById(id)
    .populate("composition.material", "reference name unit")
    .session(session || null);

const findByReference = (reference, session) =>
  Product.findOne({ reference }).session(session || null);

const findAll = async ({ skip, limit }, session) => {
  const [items, total] = await Promise.all([
    Product.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .session(session || null),
    Product.countDocuments().session(session || null),
  ]);
  return { items, total };
};

const updateById = (id, data, session) =>
  Product.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true, session },
  );

module.exports = {
  create,
  findById,
  findByIdPopulated,
  findByReference,
  findAll,
  updateById,
};
