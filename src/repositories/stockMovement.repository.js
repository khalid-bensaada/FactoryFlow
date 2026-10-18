const StockMovement = require("../models/StockMovement.model");

const create = async (data, session) => {
  const [movement] = await StockMovement.create([data], { session });
  return movement;
};

const findByMaterial = async (materialId, { skip, limit }, session) => {
  const filter = { material: materialId };
  const [items, total] = await Promise.all([
    StockMovement.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("performedBy", "name email")
      .session(session || null),
    StockMovement.countDocuments(filter).session(session || null),
  ]);
  return { items, total };
};
const createMany = (movements, session) =>
  StockMovement.create(movements, { session, ordered: true });
module.exports = { create, findByMaterial,createMany };
