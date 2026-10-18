const asyncHandler = require("../utils/asyncHandler");
const productService = require("../services/product.service");

const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({ success: true, data: { product } });
});

const list = asyncHandler(async (req, res) => {
  const data = await productService.listProducts(req.validated.query);
  res.status(200).json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const product = await productService.getProduct(req.params.id);
  res.status(200).json({ success: true, data: { product } });
});

const update = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json({ success: true, data: { product } });
});

module.exports = { create, list, getOne, update };
