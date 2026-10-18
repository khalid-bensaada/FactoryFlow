const mongoose = require("mongoose");
const AppError = require("../utils/AppError");
const rawMaterialRepository = require("../repositories/rawMaterial.repository");
const stockMovementRepository = require("../repositories/stockMovement.repository");

const buildPagination = ({ page, limit }) => ({
  skip: (page - 1) * limit,
  limit,
});

const buildResult = (items, total, { page, limit }) => ({
  items,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) },
});

const createMaterial = async (data) => {
  const existing = await rawMaterialRepository.findByReference(data.reference);
  if (existing) throw new AppError("Reference already exists", 409);

  try {
    return await rawMaterialRepository.create(data);
  } catch (err) {
    if (err.code === 11000) throw new AppError("Reference already exists", 409);
    throw err;
  }
};

const updateMaterial = async (id, data) => {
  const material = await rawMaterialRepository.updateById(id, data);
  if (!material) throw new AppError("Material not found", 404);
  return material;
};

const getMaterial = async (id) => {
  const material = await rawMaterialRepository.findById(id);
  if (!material) throw new AppError("Material not found", 404);
  return material;
};

const listMaterials = async (query) => {
  const { items, total } = await rawMaterialRepository.findAll(
    buildPagination(query),
  );
  return buildResult(items, total, query);
};

const listAlerts = async (query) => {
  const { items, total } = await rawMaterialRepository.findBelowThreshold(
    buildPagination(query),
  );
  return buildResult(items, total, query);
};

const addStock = async (materialId, quantity, userId) => {
  const session = await mongoose.startSession();
  let result;

  try {
    await session.withTransaction(async () => {
      const material = await rawMaterialRepository.incrementQuantity(
        materialId,
        quantity,
        session,
      );
      if (!material) throw new AppError("Material not found", 404);

      const movement = await stockMovementRepository.create(
        { material: materialId, type: "IN", quantity, performedBy: userId },
        session,
      );

      result = { material, movement };
    });
  } finally {
    await session.endSession();
  }

  return result;
};

const getMovements = async (materialId, query) => {
  const material = await rawMaterialRepository.findById(materialId);
  if (!material) throw new AppError("Material not found", 404);

  const { items, total } = await stockMovementRepository.findByMaterial(
    materialId,
    buildPagination(query),
  );
  return buildResult(items, total, query);
};

module.exports = {
  createMaterial,
  updateMaterial,
  getMaterial,
  listMaterials,
  listAlerts,
  addStock,
  getMovements,
};
