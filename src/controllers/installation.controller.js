const asyncHandler = require("../utils/asyncHandler");
const installationService = require("../services/installation.service");

exports.getStatus = asyncHandler(async (req, res) => {
    const installed = await installationService.getStatus();
    res.status(200).json({ installed });
});

exports.install = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const admin = await installationService.install({ name, email, password });
    res.status(201).json({
        message: "Application installed successfully",
        admin,
    });
});