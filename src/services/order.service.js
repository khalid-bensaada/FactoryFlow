const AppError = require("../utils/AppError");
const { buildPagination, buildResult } = require("../utils/pagination");
const { ORDER_STATUS } = require("../constants/orderStatus");
const orderRepository = require("../repositories/order.repository");
const productRepository = require("../repositories/product.repository");
const userRepository = require("../repositories/user.repository");
const mongoose = require("mongoose");
const rawMaterialRepository = require("../repositories/rawMaterial.repository");
const stockMovementRepository = require("../repositories/stockMovement.repository");

const idOf = (ref) => String(ref && ref._id ? ref._id : ref);

const ensureOperator = async (userId) => {
  const user = await userRepository.findById(userId);
  if (!user || user.role !== "Operator") {
    throw new AppError("Assigned user must be an existing operator", 400);
  }
  return user;
};

const ensurePlanned = (order) => {
  if (order.status !== ORDER_STATUS.PLANNED) {
    throw new AppError("Only a planned order can be changed", 409);
  }
};

const createOrder = async ({ product, quantity, assignedTo }, creator) => {
  const productDoc = await productRepository.findById(product);
  if (!productDoc) throw new AppError("Product not found", 404);

  await ensureOperator(assignedTo);

  const composition = productDoc.composition.map((item) => ({
    material: item.material,
    quantityPerUnit: item.quantityPerUnit,
  }));

  const order = await orderRepository.create({
    product,
    quantity,
    assignedTo,
    composition,
    status: ORDER_STATUS.PLANNED,
    createdBy: creator.id,
  });

  return orderRepository.findById(order._id);
};

const updateOrder = async (id, data) => {
  const order = await orderRepository.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  ensurePlanned(order);

  if (data.assignedTo) await ensureOperator(data.assignedTo);

  const updated = await orderRepository.updateById(id, data, undefined, {
    status: ORDER_STATUS.PLANNED,
  });
  if (!updated) throw new AppError("Only a planned order can be changed", 409);

  return updated;
};

const cancelOrder = async (id) => {
  const order = await orderRepository.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  ensurePlanned(order);

  const updated = await orderRepository.updateById(
    id,
    { status: ORDER_STATUS.CANCELLED },
    undefined,
    { status: ORDER_STATUS.PLANNED },
  );
  if (!updated) throw new AppError("Only a planned order can be changed", 409);

  return updated;
};

const listOrders = async (query) => {
  const { page, limit, ...filters } = query;
  const { items, total } = await orderRepository.findAll(
    filters,
    buildPagination({ page, limit }),
  );
  return buildResult(items, total, { page, limit });
};

const listMyOrders = async (userId, query) => {
  const { page, limit, ...filters } = query;
  const { items, total } = await orderRepository.findAll(
    { ...filters, assignedTo: userId },
    buildPagination({ page, limit }),
  );
  return buildResult(items, total, { page, limit });
};

const getOrder = async (id, user) => {
  const order = await orderRepository.findById(id);
  if (!order) throw new AppError("Order not found", 404);

  if (user.role !== "Admin" && idOf(order.assignedTo) !== String(user.id)) {
    throw new AppError("Order not found", 404);
  }

  return order;
};

const round = (value) => Math.round(value * 1e6) / 1e6;

const getOwnedOrder = async (id, userId) => {
  const order = await orderRepository.findById(id);
  if (!order || idOf(order.assignedTo) !== String(userId)) {
    throw new AppError("Order not found", 404);
  }
  return order;
};

const startOrder = async (orderId, user) => {
  const order = await getOwnedOrder(orderId, user.id);

  if (order.status === ORDER_STATUS.IN_PROGRESS) {
    throw new AppError("Order has already been started", 409);
  }
  if (order.status !== ORDER_STATUS.PLANNED) {
    throw new AppError("Only a planned order can be started", 409);
  }

  const needs = order.composition.map((item) => ({
    material: item.material,
    amount: round(item.quantityPerUnit * order.quantity),
  }));

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const started = await orderRepository.transitionStatus(
        orderId,
        ORDER_STATUS.PLANNED,
        {
          status: ORDER_STATUS.IN_PROGRESS,
          startedAt: new Date(),
          startedBy: user.id,
        },
        session,
      );
      if (!started) {
        throw new AppError("Order has already been started", 409);
      }

      const shortIds = [];
      for (const need of needs) {
        const updated = await rawMaterialRepository.decrementIfEnough(
          need.material,
          need.amount,
          session,
        );
        if (!updated) shortIds.push(String(need.material));
      }

      if (shortIds.length > 0) {
        const materials = await rawMaterialRepository.findManyByIds(
          shortIds,
          session,
        );
        const details = materials.map((material) => {
          const need = needs.find(
            (n) => String(n.material) === String(material._id),
          );
          return `${material.reference} (needs ${need.amount}, available ${material.quantity})`;
        });
        throw new AppError(`Insufficient stock: ${details.join(", ")}`, 409);
      }

      await stockMovementRepository.createMany(
        needs.map((need) => ({
          material: need.material,
          type: "OUT",
          quantity: need.amount,
          performedBy: user.id,
          order: orderId,
        })),
        session,
      );
    });
  } finally {
    await session.endSession();
  }

  return orderRepository.findById(orderId);
};

const finishOrder = async (orderId, user) => {
  const order = await getOwnedOrder(orderId, user.id);

  if (order.status === ORDER_STATUS.PLANNED) {
    throw new AppError("Order has not been started", 409);
  }
  if (order.status === ORDER_STATUS.DONE) {
    throw new AppError("Order has already been finished", 409);
  }
  if (order.status !== ORDER_STATUS.IN_PROGRESS) {
    throw new AppError("Only an order in progress can be finished", 409);
  }

  const finished = await orderRepository.transitionStatus(
    orderId,
    ORDER_STATUS.IN_PROGRESS,
    { status: ORDER_STATUS.DONE, finishedAt: new Date() },
  );
  if (!finished) throw new AppError("Order has already been finished", 409);

  return orderRepository.findById(orderId);
};

const listHistory = async (userId, { page, limit }) => {
  const { items, total } = await orderRepository.findAll(
    { assignedTo: userId, status: ORDER_STATUS.DONE },
    { ...buildPagination({ page, limit }), sort: { finishedAt: -1 } },
  );
  return buildResult(items, total, { page, limit });
};

module.exports = {
  createOrder,
  updateOrder,
  cancelOrder,
  listOrders,
  listMyOrders,
  getOrder,
  startOrder,
  finishOrder,
  listHistory,
};
