const AppError = require("../utils/AppError");
const { buildPagination, buildResult } = require("../utils/pagination");
const productRepository = require("../repositories/product.repository");
const rawMaterialRepository = require("../repositories/rawMaterial.repository");

const ensureNoDuplicates = (composition) => {
  const ids = composition.map((item) => String(item.material));
  if (new Set(ids).size !== ids.length) {
    throw new AppError(
      "A material cannot appear twice in the composition",
      400,
    );
  }
};

const ensureMaterialsExist = async (composition) => {
  const ids = composition.map((item) => String(item.material));
  const found = await rawMaterialRepository.findManyByIds(ids);

  if (found.length !== ids.length) {
    const foundIds = new Set(found.map((material) => String(material._id)));
    const missing = ids.filter((id) => !foundIds.has(id));
    throw new AppError(`Materials not found: ${missing.join(", ")}`, 400);
  }
};

const validateComposition = async (composition) => {
  ensureNoDuplicates(composition);
  await ensureMaterialsExist(composition);
};

const createProduct = async (data) => {
  const existing = await productRepository.findByReference(data.reference);
  if (existing) throw new AppError("Reference already exists", 409);

  await validateComposition(data.composition);

  try {
    return await productRepository.create(data);
  } catch (err) {
    if (err.code === 11000) throw new AppError("Reference already exists", 409);
    throw err;
  }
};

const updateProduct = async (id, data) => {
  const product = await productRepository.findById(id);
  if (!product) throw new AppError("Product not found", 404);

  if (data.composition) await validateComposition(data.composition);

  return productRepository.updateById(id, data);
};

const getProduct = async (id) => {
  const product = await productRepository.findByIdPopulated(id);
  if (!product) throw new AppError("Product not found", 404);
  return product;
};

const listProducts = async (query) => {
  const { items, total } = await productRepository.findAll(
    buildPagination(query),
  );
  return buildResult(items, total, query);
};

module.exports = { createProduct, updateProduct, getProduct, listProducts };
