const asyncHandler = require("../utils/asyncHandler");
const orderService = require("../services/order.service");

const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.body, req.user);
  res.status(201).json({ success: true, data: { order } });
});

const list = asyncHandler(async (req, res) => {
  const data = await orderService.listOrders(req.validated.query);
  res.status(200).json({ success: true, data });
});

const mine = asyncHandler(async (req, res) => {
  const data = await orderService.listMyOrders(
    req.user.id,
    req.validated.query,
  );
  res.status(200).json({ success: true, data });
});

const getOne = asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(req.params.id, req.user);
  res.status(200).json({ success: true, data: { order } });
});

const update = asyncHandler(async (req, res) => {
  const order = await orderService.updateOrder(req.params.id, req.body);
  res.status(200).json({ success: true, data: { order } });
});

const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.params.id);
  res.status(200).json({ success: true, data: { order } });
});

const start = asyncHandler(async (req, res) => {
  const order = await orderService.startOrder(req.params.id, req.user);
  res.status(200).json({ success: true, data: { order } });
});

const finish = asyncHandler(async (req, res) => {
  const order = await orderService.finishOrder(req.params.id, req.user);
  res.status(200).json({ success: true, data: { order } });
});

const history = asyncHandler(async (req, res) => {
  const data = await orderService.listHistory(req.user.id, req.validated.query);
  res.status(200).json({ success: true, data });
});

module.exports = { create, list, mine, getOne, update, cancel, start, finish, history };