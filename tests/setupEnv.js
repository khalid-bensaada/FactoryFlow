const baseUri =
  process.env.MONGO_URI || "mongodb://mongo:27017/factoryflow?replicaSet=rs0";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret_value";
process.env.JWT_EXPIRES_IN = "1h";
process.env.MONGO_URI =
  process.env.TEST_MONGO_URI ||
  baseUri.replace(/\/[^/?]+(\?|$)/, "/factoryflow_test$1");

if (!process.env.MONGO_URI.includes("_test")) {
  throw new Error("Tests must run on a database whose name contains _test");
}
