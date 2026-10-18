const buildPagination = ({ page, limit }) => ({
  skip: (page - 1) * limit,
  limit,
});

const buildResult = (items, total, { page, limit }) => ({
  items,
  pagination: { page, limit, total, pages: Math.ceil(total / limit) },
});

module.exports = { buildPagination, buildResult };
