const {
  api,
  connect,
  disconnect,
  clearDatabase,
  setupUsers,
  createMaterial,
  addStock,
  getMaterial,
} = require("./helpers");

describe("Raw materials and stock", () => {
  let ctx;

  const materialData = (overrides = {}) => ({
    reference: "MAT-A",
    name: "Material A",
    unit: "kg",
    alertThreshold: 10,
    ...overrides,
  });

  beforeAll(connect);
  afterAll(disconnect);

  beforeEach(async () => {
    await clearDatabase();
    ctx = await setupUsers();
  });

  test("admin creates a material with quantity 0 by default", async () => {
    const res = await api("post", "/materials", ctx.adminToken).send(
      materialData(),
    );

    expect(res.status).toBe(201);
    expect(res.body.data.material.quantity).toBe(0);
    expect(res.body.data.material.reference).toBe("MAT-A");
  });

  test("the reference is trimmed", async () => {
    const res = await api("post", "/materials", ctx.adminToken).send(
      materialData({ reference: "  MAT-A  " }),
    );

    expect(res.status).toBe(201);
    expect(res.body.data.material.reference).toBe("MAT-A");
  });

  test("a duplicate reference returns 409", async () => {
    await createMaterial(ctx.adminToken, materialData());
    const res = await api("post", "/materials", ctx.adminToken).send(
      materialData(),
    );

    expect(res.status).toBe(409);
  });

  test("invalid data returns 400", async () => {
    const missingUnit = await api("post", "/materials", ctx.adminToken).send({
      reference: "MAT-X",
      name: "X",
    });
    const negativeQuantity = await api(
      "post",
      "/materials",
      ctx.adminToken,
    ).send(materialData({ reference: "MAT-Y", quantity: -5 }));
    const negativeThreshold = await api(
      "post",
      "/materials",
      ctx.adminToken,
    ).send(materialData({ reference: "MAT-Z", alertThreshold: -1 }));

    expect(missingUnit.status).toBe(400);
    expect(negativeQuantity.status).toBe(400);
    expect(negativeThreshold.status).toBe(400);
  });

  test("an operator gets 403 and a missing token gets 401", async () => {
    const operator = await api("get", "/materials", ctx.operatorToken);
    const anonymous = await api("get", "/materials");

    expect(operator.status).toBe(403);
    expect(anonymous.status).toBe(401);
  });

  test("a stock entry increases the quantity and records an IN movement", async () => {
    const material = await createMaterial(ctx.adminToken, materialData());

    const res = await addStock(ctx.adminToken, material._id, 50);

    expect(res.status).toBe(201);
    expect(res.body.data.material.quantity).toBe(50);
    expect(res.body.data.movement.type).toBe("IN");
    expect(res.body.data.movement.quantity).toBe(50);

    const movements = await api(
      "get",
      `/materials/${material._id}/movements`,
      ctx.adminToken,
    );
    expect(movements.status).toBe(200);
    expect(movements.body.data.items).toHaveLength(1);
    expect(movements.body.data.items[0].type).toBe("IN");
  });

  test("a stock entry with quantity 0 or negative returns 400 and changes nothing", async () => {
    const material = await createMaterial(ctx.adminToken, materialData());

    const zero = await addStock(ctx.adminToken, material._id, 0);
    const negative = await addStock(ctx.adminToken, material._id, -3);
    const after = await getMaterial(ctx.adminToken, material._id);

    expect(zero.status).toBe(400);
    expect(negative.status).toBe(400);
    expect(after.quantity).toBe(0);
  });

  test("a stock entry for an unknown material returns 404 and an invalid id returns 400", async () => {
    const unknown = await addStock(
      ctx.adminToken,
      "64f1a2b3c4d5e6f708192a3b",
      10,
    );
    const invalid = await addStock(ctx.adminToken, "abc", 10);

    expect(unknown.status).toBe(404);
    expect(invalid.status).toBe(400);
  });

  test("the quantity cannot be changed through update", async () => {
    const material = await createMaterial(ctx.adminToken, materialData());

    const res = await api(
      "patch",
      `/materials/${material._id}`,
      ctx.adminToken,
    ).send({
      quantity: 999,
    });
    const after = await getMaterial(ctx.adminToken, material._id);

    expect(res.status).toBe(400);
    expect(after.quantity).toBe(0);
  });

  test("update changes name, unit and alert threshold", async () => {
    const material = await createMaterial(ctx.adminToken, materialData());

    const res = await api(
      "patch",
      `/materials/${material._id}`,
      ctx.adminToken,
    ).send({
      name: "Renamed",
      alertThreshold: 20,
    });

    expect(res.status).toBe(200);
    expect(res.body.data.material.name).toBe("Renamed");
    expect(res.body.data.material.alertThreshold).toBe(20);
  });

  test("an empty update returns 400", async () => {
    const material = await createMaterial(ctx.adminToken, materialData());
    const res = await api(
      "patch",
      `/materials/${material._id}`,
      ctx.adminToken,
    ).send({});

    expect(res.status).toBe(400);
  });

  test("alerts list materials with quantity lower than or equal to the threshold", async () => {
    await createMaterial(
      ctx.adminToken,
      materialData({ reference: "LOW", quantity: 5 }),
    );
    await createMaterial(
      ctx.adminToken,
      materialData({ reference: "EQUAL", quantity: 10 }),
    );
    await createMaterial(
      ctx.adminToken,
      materialData({ reference: "HIGH", quantity: 50 }),
    );

    const res = await api("get", "/materials/alerts", ctx.adminToken);
    const references = res.body.data.items.map((item) => item.reference).sort();

    expect(res.status).toBe(200);
    expect(references).toEqual(["EQUAL", "LOW"]);
  });

  test("the list is paginated", async () => {
    await createMaterial(ctx.adminToken, materialData({ reference: "M1" }));
    await createMaterial(ctx.adminToken, materialData({ reference: "M2" }));
    await createMaterial(ctx.adminToken, materialData({ reference: "M3" }));

    const res = await api("get", "/materials?page=1&limit=2", ctx.adminToken);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.pagination).toEqual({
      page: 1,
      limit: 2,
      total: 3,
      pages: 2,
    });
  });

  test("invalid pagination parameters return 400", async () => {
    const letters = await api("get", "/materials?limit=abc", ctx.adminToken);
    const zeroPage = await api("get", "/materials?page=0", ctx.adminToken);
    const tooBig = await api("get", "/materials?limit=1000", ctx.adminToken);

    expect(letters.status).toBe(400);
    expect(zeroPage.status).toBe(400);
    expect(tooBig.status).toBe(400);
  });

  test("alerts is not mistaken for an id", async () => {
    const res = await api("get", "/materials/alerts", ctx.adminToken);
    expect(res.status).toBe(200);
  });
});
