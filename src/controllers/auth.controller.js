const asyncHandler = require("../utils/asyncHandler");
const authService = require("../services/auth.service");
const userService = require("../services/user.service");

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.status(200).json({ success: true, data: result });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await userService.getProfile(req.user.id);
  res.status(200).json({ success: true, data: { user } });
});

module.exports = { login, getMe };
