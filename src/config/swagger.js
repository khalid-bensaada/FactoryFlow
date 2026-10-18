const swaggerJsdoc = require("swagger-jsdoc");
const env = require("./env");

const objectIdExample = "64f1a2b3c4d5e6f708192a3b";

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const id = { type: "string", example: objectIdExample };
const date = { type: "string", format: "date-time" };
const nullableDate = { type: "string", format: "date-time", nullable: true };
const text = (example) => ({ type: "string", example });
const number = (example) => ({ type: "number", example });
const orderStatuses = ["planifié", "en cours", "terminé", "annulé"];

const envelope = (data) => ({
  type: "object",
  properties: {
    success: { type: "boolean", example: true },
    data,
  },
});

const single = (key, schema) =>
  envelope({ type: "object", properties: { [key]: ref(schema) } });

const paged = (schema) =>
  envelope({
    type: "object",
    properties: {
      items: { type: "array", items: ref(schema) },
      pagination: ref("Pagination"),
    },
  });

const body = (properties, required, example) => ({
  type: "object",
  ...(required.length ? { required } : {}),
  properties,
  additionalProperties: false,
  example,
});

const timestamps = { createdAt: date, updatedAt: date };

const compositionItem = {
  type: "object",
  properties: { material: id, quantityPerUnit: number(2) },
};

const schemas = {
  Error: {
    type: "object",
    properties: {
      success: { type: "boolean", example: false },
      message: { type: "string" },
    },
  },
  Pagination: {
    type: "object",
    properties: {
      page: { type: "integer", example: 1 },
      limit: { type: "integer", example: 20 },
      total: { type: "integer", example: 42 },
      pages: { type: "integer", example: 3 },
    },
  },
  User: {
    type: "object",
    properties: {
      _id: id,
      name: text("Operator One"),
      email: {
        type: "string",
        format: "email",
        example: "operator@factoryflow.local",
      },
      role: { type: "string", enum: ["Admin", "Operator"] },
      ...timestamps,
    },
  },
  RawMaterial: {
    type: "object",
    properties: {
      _id: id,
      reference: text("MAT-A"),
      name: text("Material A"),
      unit: text("kg"),
      quantity: number(100),
      alertThreshold: number(10),
      ...timestamps,
    },
  },
  CompositionItem: compositionItem,
  Product: {
    type: "object",
    properties: {
      _id: id,
      reference: text("PRD-001"),
      name: text("Product One"),
      description: text("Needs 2 kg of A and 3 units of B per unit"),
      composition: { type: "array", items: ref("CompositionItem") },
      ...timestamps,
    },
  },
  ProductDetail: {
    type: "object",
    properties: {
      _id: id,
      reference: text("PRD-001"),
      name: text("Product One"),
      description: text("Needs 2 kg of A and 3 units of B per unit"),
      composition: {
        type: "array",
        items: {
          type: "object",
          properties: {
            material: {
              type: "object",
              properties: {
                _id: id,
                reference: text("MAT-A"),
                name: text("Material A"),
                unit: text("kg"),
              },
            },
            quantityPerUnit: number(2),
          },
        },
      },
      ...timestamps,
    },
  },
  StockMovement: {
    type: "object",
    properties: {
      _id: id,
      material: id,
      type: { type: "string", enum: ["IN", "OUT"] },
      quantity: number(20),
      performedBy: {
        description:
          "User id, or an object with name and email when movements are listed",
        oneOf: [
          { type: "string" },
          {
            type: "object",
            properties: {
              _id: id,
              name: text("Admin"),
              email: text("admin@factoryflow.local"),
            },
          },
        ],
      },
      order: { type: "string", nullable: true, example: objectIdExample },
      ...timestamps,
    },
  },
  ManufacturingOrder: {
    type: "object",
    properties: {
      _id: id,
      product: {
        type: "object",
        properties: {
          _id: id,
          reference: text("PRD-001"),
          name: text("Product One"),
        },
      },
      quantity: number(10),
      status: { type: "string", enum: orderStatuses, example: "planifié" },
      composition: { type: "array", items: ref("CompositionItem") },
      assignedTo: {
        type: "object",
        properties: {
          _id: id,
          name: text("Operator One"),
          email: text("operator@factoryflow.local"),
        },
      },
      createdBy: id,
      startedBy: { type: "string", nullable: true, example: objectIdExample },
      startedAt: nullableDate,
      finishedAt: nullableDate,
      ...timestamps,
    },
  },

  InstallationRequest: body(
    {
      name: text("Admin"),
      email: text("admin@factoryflow.local"),
      password: text("ChangeMe123!"),
    },
    ["name", "email", "password"],
    {
      name: "Admin",
      email: "admin@factoryflow.local",
      password: "ChangeMe123!",
    },
  ),
  LoginRequest: body(
    { email: text("admin@factoryflow.local"), password: text("ChangeMe123!") },
    ["email", "password"],
    { email: "admin@factoryflow.local", password: "ChangeMe123!" },
  ),
  CreateOperatorRequest: body(
    {
      name: text("Operator One"),
      email: text("operator@factoryflow.local"),
      password: { type: "string", minLength: 8, example: "Operator123!" },
    },
    ["name", "email", "password"],
    {
      name: "Operator One",
      email: "operator@factoryflow.local",
      password: "Operator123!",
    },
  ),
  CreateMaterialRequest: body(
    {
      reference: text("MAT-A"),
      name: text("Material A"),
      unit: text("kg"),
      quantity: { type: "number", minimum: 0, example: 0 },
      alertThreshold: { type: "number", minimum: 0, example: 10 },
    },
    ["reference", "name", "unit"],
    { reference: "MAT-A", name: "Material A", unit: "kg", alertThreshold: 10 },
  ),
  UpdateMaterialRequest: body(
    {
      name: text("Material A (updated)"),
      unit: text("kg"),
      alertThreshold: { type: "number", minimum: 0, example: 15 },
    },
    [],
    { name: "Material A (updated)", alertThreshold: 15 },
  ),
  StockEntryRequest: body(
    {
      quantity: {
        type: "number",
        minimum: 0,
        exclusiveMinimum: true,
        example: 100,
      },
    },
    ["quantity"],
    { quantity: 100 },
  ),
  CreateProductRequest: body(
    {
      reference: text("PRD-001"),
      name: text("Product One"),
      description: text("Needs 2 kg of A and 3 units of B per unit"),
      composition: {
        type: "array",
        minItems: 1,
        items: ref("CompositionItem"),
      },
    },
    ["reference", "name", "composition"],
    {
      reference: "PRD-001",
      name: "Product One",
      description: "Needs 2 kg of A and 3 units of B per unit",
      composition: [
        { material: objectIdExample, quantityPerUnit: 2 },
        { material: "64f1a2b3c4d5e6f708192a3c", quantityPerUnit: 3 },
      ],
    },
  ),
  UpdateProductRequest: body(
    {
      name: text("Product One (updated)"),
      description: text("New description"),
      composition: {
        type: "array",
        minItems: 1,
        items: ref("CompositionItem"),
      },
    },
    [],
    {
      name: "Product One (updated)",
      composition: [{ material: objectIdExample, quantityPerUnit: 4 }],
    },
  ),
  CreateOrderRequest: body(
    {
      product: id,
      quantity: {
        type: "number",
        minimum: 0,
        exclusiveMinimum: true,
        example: 10,
      },
      assignedTo: id,
    },
    ["product", "quantity", "assignedTo"],
    {
      product: objectIdExample,
      quantity: 10,
      assignedTo: "64f1a2b3c4d5e6f708192a3d",
    },
  ),
  UpdateOrderRequest: body(
    {
      quantity: {
        type: "number",
        minimum: 0,
        exclusiveMinimum: true,
        example: 12,
      },
      assignedTo: id,
    },
    [],
    { quantity: 12 },
  ),

  InstallationStatusResult: envelope({
    type: "object",
    properties: { installed: { type: "boolean", example: false } },
  }),
  LoginResult: envelope({
    type: "object",
    properties: { token: { type: "string" }, user: ref("User") },
  }),
  UserResult: single("user", "User"),
  MaterialResult: single("material", "RawMaterial"),
  ProductResult: single("product", "Product"),
  ProductDetailResult: single("product", "ProductDetail"),
  OrderResult: single("order", "ManufacturingOrder"),
  StockEntryResult: envelope({
    type: "object",
    properties: {
      material: ref("RawMaterial"),
      movement: ref("StockMovement"),
    },
  }),
  MaterialList: paged("RawMaterial"),
  ProductList: paged("Product"),
  OrderList: paged("ManufacturingOrder"),
  MovementList: paged("StockMovement"),
};

const requestNames = Object.keys(schemas).filter((name) =>
  name.endsWith("Request"),
);

const resultNames = Object.keys(schemas).filter(
  (name) => name.endsWith("Result") || name.endsWith("List"),
);

const requestBodies = Object.fromEntries(
  requestNames.map((name) => [
    name,
    { required: true, content: { "application/json": { schema: ref(name) } } },
  ]),
);

const errorResponse = (description, message) => ({
  description,
  content: {
    "application/json": {
      schema: ref("Error"),
      example: { success: false, message },
    },
  },
});

const responses = {
  ...Object.fromEntries(
    resultNames.map((name) => [
      name,
      {
        description: "Successful response",
        content: { "application/json": { schema: ref(name) } },
      },
    ]),
  ),
  BadRequest: errorResponse(
    "Invalid request data",
    "quantity: Number must be greater than 0",
  ),
  Unauthorized: errorResponse(
    "Missing, invalid or expired token",
    "Authentication required",
  ),
  Forbidden: errorResponse("The role of the user is not allowed", "Forbidden"),
  NotFound: errorResponse("Resource not found", "Order not found"),
  Conflict: errorResponse(
    "Conflict with the current state",
    "Reference already exists",
  ),
};

const queryParam = (name, schema, description) => ({
  name,
  in: "query",
  description,
  schema,
});

const parameters = {
  IdParam: {
    name: "id",
    in: "path",
    required: true,
    description: "MongoDB ObjectId",
    schema: { type: "string", example: objectIdExample },
  },
  PageParam: queryParam(
    "page",
    { type: "integer", minimum: 1, default: 1 },
    "Page number",
  ),
  LimitParam: queryParam(
    "limit",
    { type: "integer", minimum: 1, maximum: 100, default: 20 },
    "Items per page (max 100)",
  ),
  StatusFilter: queryParam(
    "status",
    { type: "string", enum: orderStatuses },
    "Filter by status",
  ),
  ProductFilter: queryParam(
    "product",
    { type: "string", example: objectIdExample },
    "Filter by product id",
  ),
  FromFilter: queryParam(
    "from",
    { type: "string", example: "2026-01-01" },
    "Creation date from (inclusive)",
  ),
  ToFilter: queryParam(
    "to",
    { type: "string", example: "2026-12-31" },
    "Creation date to. A date without time includes the whole day",
  ),
};

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "FactoryFlow API",
      version: "1.0.0",
      description:
        "Manufacturing orders and raw material stock management. Roles: Admin and Operator.",
    },
    servers: [{ url: `http://localhost:${env.PORT}/api` }],
    tags: [
      { name: "Installation" },
      { name: "Auth" },
      { name: "Users" },
      { name: "Materials" },
      { name: "Products" },
      { name: "Orders" },
    ],
    security: [{ bearerAuth: [] }],
    components: {
      securitySchemes: {
        bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      },
      parameters,
      requestBodies,
      schemas,
      responses,
    },
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerJsdoc(options);
