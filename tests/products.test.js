const {
  api,
  connect,
  disconnect,
  clearDatabase,
  setupUsers,
  createMaterial,
  createProduct,
} = require("./helpers");

describe("Products and composition", () => {
  let ctx;
  let a;
  let b;

  const productData = (overrides = {}) => ({
    reference: "PRD-001",
    name: "Product One",
    composition: [
      { material: a._id, quantityPerUnit: 2 },
      { material: b._id, quantityPerUnit: 3 },
    ],
    ...overrides,
  });

  beforeAll(connect);
  afterAll(disconnect);

  beforeEach(async () => {
    await clearDatabase();
    ctx = await setupUsers();
    a = await createMaterial(ctx.adminToken, {
      reference: "MAT-A",
      name: "Material A",
      unit: "kg",
    });
    b = await createMaterial(ctx.adminToken, {
      reference: "MAT-B",
      name: "Material B",
      unit: "unit",
    });
  });

  test("admin creates a product with a valid composition", async () => {
    const res = await api("post", "/products", ctx.adminToken).send(
      productData(),
    );

    expect(res.status).toBe(201);
    expect(res.body.data.product.composition).toHaveLength(2);
  });

  test("a duplicate reference returns 409", async () => {
    await createProduct(ctx.adminToken, productData());
    const res = await api("post", "/products", ctx.adminToken).send(
      productData(),
    );

    expect(res.status).toBe(409);
  });

  test("an empty composition returns 400", async () => {
    const res = await api("post", "/products", ctx.adminToken).send(
      productData({ composition: [] }),
    );

    expect(res.status).toBe(400);
  });

  test("a material repeated in the composition returns 400", async () => {
    const res = await api("post", "/products", ctx.adminToken).send(
      productData({
        composition: [
          { material: a._id, quantityPerUnit: 2 },
          { material: a._id, quantityPerUnit: 3 },
        ],
      }),
    );

    expect(res.status).toBe(400);
  });

  test("a quantity of 0 or negative returns 400", async () => {
    const zero = await api("post", "/products", ctx.adminToken).send(
      productData({ composition: [{ material: a._id, quantityPerUnit: 0 }] }),
    );
    const negative = await api("post", "/products", ctx.adminToken).send(
      productData({ composition: [{ material: a._id, quantityPerUnit: -1 }] }),
    );

    expect(zero.status).toBe(400);
    expect(negative.status).toBe(400);
  });

  test("an unknown material returns 400 and the message names it", async () => {
    const unknownId = "64f1a2b3c4d5e6f708192a3b";
    const res = await api("post", "/products", ctx.adminToken).send(
      productData({
        composition: [{ material: unknownId, quantityPerUnit: 1 }],
      }),
    );

    expect(res.status).toBe(400);
    expect(res.body.message).toContain(unknownId);
  });

  test("an invalid material id returns 400", async () => {
    const res = await api("post", "/products", ctx.adminToken).send(
      productData({ composition: [{ material: "abc", quantityPerUnit: 1 }] }),
    );

    expect(res.status).toBe(400);
  });

  test("an operator gets 403 and a missing token gets 401", async () => {
    const operator = await api("post", "/products", ctx.operatorToken).send(
      productData(),
    );
    const anonymous = await api("get", "/products");

    expect(operator.status).toBe(403);
    expect(anonymous.status).toBe(401);
  });

  test("details include the data of each material", async () => {
    const product = await createProduct(ctx.adminToken, productData());

    const res = await api("get", `/products/${product._id}`, ctx.adminToken);

    expect(res.status).toBe(200);
    expect(res.body.data.product.composition[0].material.name).toBe(
      "Material A",
    );
    expect(res.body.data.product.composition[0].material.unit).toBe("kg");
  });

  test("an unknown product returns 404 and an invalid id returns 400", async () => {
    const unknown = await api(
      "get",
      "/products/64f1a2b3c4d5e6f708192a3b",
      ctx.adminToken,
    );
    const invalid = await api("get", "/products/abc", ctx.adminToken);

    expect(unknown.status).toBe(404);
    expect(invalid.status).toBe(400);
  });

  test("update replaces the composition", async () => {
    const product = await createProduct(ctx.adminToken, productData());

    const res = await api(
      "patch",
      `/products/${product._id}`,
      ctx.adminToken,
    ).send({
      composition: [{ material: b._id, quantityPerUnit: 7 }],
    });

    expect(res.status).toBe(200);
    expect(res.body.data.product.composition).toHaveLength(1);
    expect(res.body.data.product.composition[0].quantityPerUnit).toBe(7);
  });

  test("the reference cannot be changed", async () => {
    const product = await createProduct(ctx.adminToken, productData());

    const res = await api(
      "patch",
      `/products/${product._id}`,
      ctx.adminToken,
    ).send({
      reference: "PRD-999",
    });

    expect(res.status).toBe(400);
  });

  test("the list is paginated", async () => {
    await createProduct(ctx.adminToken, productData({ reference: "P1" }));
    await createProduct(ctx.adminToken, productData({ reference: "P2" }));

    const res = await api("get", "/products?page=1&limit=1", ctx.adminToken);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.pagination.total).toBe(2);
  });
});
