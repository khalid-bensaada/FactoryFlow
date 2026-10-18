const AppError = require("../utils/AppError");

const notFound = (req, res, next) => {
    next(new AppError(`Route not found: ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message;
    let isOperational = err.isOperational === true;

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0];
        statusCode = 409;
        message = field ? `${field} already exists` : "Duplicate value";
        isOperational = true;
    }

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(", ");
        isOperational = true;
    }

    if (!isOperational) {
        console.error(err);
        message = "Internal server error";
    }

    res.status(statusCode).json({ status: statusCode, message });
};

module.exports = { notFound, errorHandler };