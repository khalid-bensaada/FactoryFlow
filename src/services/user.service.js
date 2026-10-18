const AppError = require("../utils/AppError");
const userRepository = require("../repositories/user.repository");

const sanitize = (user) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

const createOperator = async ({ name, email, password }) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) throw new AppError("Email already in use", 409);

  const user = await userRepository.create({
    name,
    email,
    password,
    role: "Operator",
  });

  return sanitize(user);
};

const getProfile = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw new AppError("User not found", 404);
  return sanitize(user);
};

module.exports = { createOperator, getProfile };
