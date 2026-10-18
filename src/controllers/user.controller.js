const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

const createOperator = asyncHandler(async (req, res) => {

  const { name, email, password } = req.body;

  const user = await userService.createOperator({ name, email, password });

  res.status(201).json({ success: true, data: { user } });
  
});

module.exports = { createOperator };