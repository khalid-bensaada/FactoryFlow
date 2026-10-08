const asyncHandler = (k) => (req, res, next) => {
    Promise.resolve(k(req, res, next)).catch(next);
};

module.exports = asyncHandler;