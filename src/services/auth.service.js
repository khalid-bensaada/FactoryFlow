const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const userRepository = require("../repositories/user.repository");

const invalidCredentials = () => new AppError("Invalid email or password", 401);

const login = async (email, password) => {
  const user = await userRepository.findByEmailWithPassword(email);
  if (!user) throw invalidCredentials();

  const matches = await bcrypt.compare(password, user.password);
  if (!matches) throw invalidCredentials();

  const token = jwt.sign({ id: user._id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const safeUser = user.toObject();
  delete safeUser.password;

  return { token, user: safeUser };
};

module.exports = { login };
