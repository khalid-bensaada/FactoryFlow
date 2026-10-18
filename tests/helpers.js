const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../src/app");
const env = require("../src/config/env");
const User = require("../src/models/user.model");

const connect = async () => {
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  await Promise.all(
    Object.values(mongoose.models).map((model) => model.init()),
  );
};

const disconnect = () => mongoose.disconnect();

const clearDatabase = async () => {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
};

const api = (method, path, token) => {
  const req = request(app)[method](`/api${path}`);
  return token ? req.set("Authorization", `Bearer ${token}`) : req;
};

const createUser = ({ name, email, password, role }) =>
  User.create({ name, email, password, role });

const login = async (email, password) => {
  const res = await api("post", "/auth/login").send({ email, password });

  if (res.status !== 200) {
    throw new Error(
      `Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`,
    );
  }

  return res.body.data.token;
};

const setupUsers = async () => {
  const admin = await createUser({
    name: "Admin",
    email: "admin@test.local",
    password: "Admin12345",
    role: "Admin",
  });
  const operator = await createUser({
    name: "Operator",
    email: "operator@test.local",
    password: "Operator123",
    role: "Operator",
  });

  return {
    adminId: String(admin._id),
    operatorId: String(operator._id),
    adminToken: await login("admin@test.local", "Admin12345"),
    operatorToken: await login("operator@test.local", "Operator123"),
  };
};

const createMaterial = async (token, data) => {
  const res = await api("post", "/materials", token).send(data);
  return res.body.data.material;
};

const addStock = (token, id, quantity) =>
  api("post", `/materials/${id}/stock-entries`, token).send({ quantity });

const getMaterial = async (token, id) => {
  const res = await api("get", `/materials/${id}`, token);
  return res.body.data.material;
};

const createProduct = async (token, data) => {
  const res = await api("post", "/products", token).send(data);
  return res.body.data.product;
};

const createOrder = async (token, data) => {
  const res = await api("post", "/orders", token).send(data);
  return res.body.data.order;
};

const seedScenario = async (adminToken) => {
  const a = await createMaterial(adminToken, {
    reference: "MAT-A",
    name: "Material A",
    unit: "kg",
    alertThreshold: 10,
  });
  const b = await createMaterial(adminToken, {
    reference: "MAT-B",
    name: "Material B",
    unit: "unit",
    alertThreshold: 10,
  });
  await addStock(adminToken, a._id, 100);
  await addStock(adminToken, b._id, 100);

  const product = await createProduct(adminToken, {
    reference: "PRD-001",
    name: "Product One",
    composition: [
      { material: a._id, quantityPerUnit: 2 },
      { material: b._id, quantityPerUnit: 3 },
    ],
  });

  return { a, b, product };
};

module.exports = {
  api,
  connect,
  disconnect,
  clearDatabase,
  createUser,
  login,
  setupUsers,
  createMaterial,
  addStock,
  getMaterial,
  createProduct,
  createOrder,
  seedScenario,
};
