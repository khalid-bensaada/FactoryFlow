const express = require("express");
const controller = require("../controllers/product.controller");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const {
  idParamSchema,
  paginationSchema,
} = require("../validators/rawMaterial.validator");
const {
  createProductSchema,
  updateProductSchema,
} = require("../validators/product.validator");

const router = express.Router();

router.use(auth, role(["Admin"]));

router.post("/", validate(createProductSchema), controller.create);
router.get("/", validate(paginationSchema, "query"), controller.list);
router.get("/:id", validate(idParamSchema, "params"), controller.getOne);
router.patch(
  "/:id",
  validate(idParamSchema, "params"),
  validate(updateProductSchema),
  controller.update,
);

module.exports = router;
