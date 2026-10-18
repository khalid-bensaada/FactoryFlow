const jwt = require("jsonwebtoken");
const env = require("../config/env");
const AppError = require("../utils/AppError");
const userRepository = require("../repositories/user.repository");

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, env.JWT_SECRET);

    const user = await userRepository.findById(payload.id);
    if (!user) throw new AppError("Authentication required", 401);

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(new AppError("Invalid or expired token", 401));
  }
};

module.exports = auth;
