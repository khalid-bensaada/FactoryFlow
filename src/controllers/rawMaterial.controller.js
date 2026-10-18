const asyncHandler = require("../utils/asyncHandler");
const rawMaterialService = require("../services/rawMaterial.service");

const create = asyncHandler(async (req, res) => {
  const material = await rawMaterialService.createMaterial(req.body);
  res.status(201).json({ success: true, data: { material } });
});

const list = asyncHandler(async (req, res) => {
  const data = await rawMaterialService.listMaterials(req.validated.query);
  res.status(200).json({ success: true, data });
});

const alerts = asyncHandler(async (req, res) => {
  const data = await rawMaterialService.listAlerts(req.validated.query);
  res.status(200).json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const material = await rawMaterialService.getMaterial(req.params.id);
  res.status(200).json({ success: true, data: { material } });
});

const update = asyncHandler(async (req, res) => {
  const material = await rawMaterialService.updateMaterial(
    req.params.id,
    req.body,
  );
  res.status(200).json({ success: true, data: { material } });
});

const addStock = asyncHandler(async (req, res) => {
  const data = await rawMaterialService.addStock(
    req.params.id,
    req.body.quantity,
    req.user.id,
  );
  res.status(201).json({ success: true, data });
});

const movements = asyncHandler(async (req, res) => {
  const data = await rawMaterialService.getMovements(
    req.params.id,
    req.validated.query,
  );
  res.status(200).json({ success: true, data });
});

module.exports = { create, list, alerts, getOne, update, addStock, movements };
