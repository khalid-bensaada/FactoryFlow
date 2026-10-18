const express = require("express");
const installationRoutes = require("./installation.routes");
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const rawMaterialRoutes = require("./rawMaterial.routes");
const productRoutes = require("./product.routes");
const orderRoutes = require("./order.routes");

const router = express.Router();

router.use("/installation", installationRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/materials", rawMaterialRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);

module.exports = router;
