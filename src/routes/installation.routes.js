const express = require("express");
const installationController = require("../controllers/installation.controller");
const validate = require("../middlewares/validate.middleware");

const router = express.Router();

router.get("/status", installationController.getStatus);
router.post("/", validate, installationController.install);

module.exports = router;