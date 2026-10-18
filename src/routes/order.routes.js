const express = require("express");
const controller = require("../controllers/order.controller");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  idParamSchema,
  paginationSchema,
} = require("../validators/rawMaterial.validator");
const {
  createOrderSchema,
  updateOrderSchema,
  listOrdersQuerySchema,
} = require("../validators/order.validator");

const router = express.Router();

router.post(
  "/",
  auth,
  role(["Admin"]),
  validate(createOrderSchema),
  controller.create,
);

router.get(
  "/",
  auth,
  role(["Admin"]),
  validate(listOrdersQuerySchema, "query"),
  controller.list,
);

router.get(
  "/mine",
  auth,
  role(["Operator"]),
  validate(listOrdersQuerySchema, "query"),
  controller.mine,
);

router.get(
  "/history",
  auth,
  role(["Operator"]),
  validate(paginationSchema, "query"),
  controller.history,
);

router.get("/:id", auth, validate(idParamSchema, "params"), controller.getOne);

router.patch(
  "/:id",
  auth,
  role(["Admin"]),
  validate(idParamSchema, "params"),
  validate(updateOrderSchema),
  controller.update,
);

router.post(
  "/:id/cancel",
  auth,
  role(["Admin"]),
  validate(idParamSchema, "params"),
  controller.cancel,
);

router.post(
  "/:id/start",
  auth,
  role(["Operator"]),
  validate(idParamSchema, "params"),
  controller.start,
);

router.post(
  "/:id/finish",
  auth,
  role(["Operator"]),
  validate(idParamSchema, "params"),
  controller.finish,
);

module.exports = router;
