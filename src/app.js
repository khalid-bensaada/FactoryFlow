const express = require("express");
const swaggerUi = require("swagger-ui-express");
const routes = require("./routes");
const swaggerSpec = require("./config/swagger");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
