const AppError = require("../utils/AppError");

const role = (allowedRoles) => (req, res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new AppError("Forbidden", 403));
  }
  next();
};

module.exports = role;
