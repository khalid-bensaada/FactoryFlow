const express = require("express");
const userController = require("../controllers/user.controller");
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const validate = require("../middlewares/validate.middleware");
const { createOperatorSchema } = require("../validators/user.validator");

const router = express.Router();

router.post(
  "/",
  auth,
  role(["Admin"]),
  validate(createOperatorSchema),
  userController.createOperator,
);

module.exports = router;
