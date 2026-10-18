const express = require("express");
const controller = require("../controllers/rawMaterial.controller");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  idParamSchema,
  paginationSchema,
  createMaterialSchema,
  updateMaterialSchema,
  stockEntrySchema,
} = require("../validators/rawMaterial.validator");

const router = express.Router();

router.use(auth, role(["Admin"]));

router.post("/", validate(createMaterialSchema), controller.create);
router.get("/", validate(paginationSchema, "query"), controller.list);
router.get("/alerts", validate(paginationSchema, "query"), controller.alerts);
router.get("/:id", validate(idParamSchema, "params"), controller.getOne);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateMaterialSchema),
  controller.update,
);
router.post(
  "/:id/stock-entries",
  validate(idParamSchema, "params"),
  validate(stockEntrySchema),
  controller.addStock,
);
router.get(
  "/:id/movements",
  validate(idParamSchema, "params"),
  validate(paginationSchema, "query"),
  controller.movements,
);

module.exports = router;
