const AppError = require("../utils/AppError");

const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join(".") || source}: ${issue.message}`)
        .join(", ");
      return next(new AppError(message, 400));
    }

    req.validated = { ...(req.validated || {}), [source]: result.data };
    if (source === "body") req.body = result.data;
    next();
  };

module.exports = validate;
