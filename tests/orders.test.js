const {
  api,
  connect,
  disconnect,
  clearDatabase,
  createUser,
  login,
  setupUsers,
  seedScenario,
  createOrder,
} = require("./helpers");

describe("Manufacturing orders", () => {
  let ctx;
  let scenario;

  const orderData = (overrides = {}) => ({
    product: scenario.product._id,
    quantity: 10,
    assignedTo: ctx.operatorId,
    ...overrides,
  });

  beforeAll(connect);
  afterAll(disconnect);

  beforeEach(async () => {
    await clearDatabase();
    ctx = await setupUsers();
    scenario = await seedScenario(ctx.adminToken);
  });

  test("admin creates an order with a copy of the composition", async () => {
    const res = await api("post", "/orders", ctx.adminToken).send(orderData());

    expect(res.status).toBe(201);
    expect(res.body.data.order.status).toBe("planifié");
    expect(
      res.body.data.order.composition.map((item) => item.quantityPerUnit),
    ).toEqual([2, 3]);
  });

  test("changing the product later does not change the order", async () => {
    const order = await createOrder(ctx.adminToken, orderData());

    await api(
      "patch",
      `/products/${scenario.product._id}`,
      ctx.adminToken,
    ).send({
      composition: [{ material: scenario.a._id, quantityPerUnit: 9 }],
    });

    const res = await api("get", `/orders/${order._id}`, ctx.adminToken);

    expect(res.status).toBe(200);
    expect(
      res.body.data.order.composition.map((item) => item.quantityPerUnit),
    ).toEqual([2, 3]);
  });

  test("assigning an order to an admin or to an unknown user returns 400", async () => {
    const toAdmin = await api("post", "/orders", ctx.adminToken).send(
      orderData({ assignedTo: ctx.adminId }),
    );
    const toUnknown = await api("post", "/orders", ctx.adminToken).send(
      orderData({ assignedTo: "64f1a2b3c4d5e6f708192a3b" }),
    );

    expect(toAdmin.status).toBe(400);
    expect(toUnknown.status).toBe(400);
  });

  test("an unknown product returns 404", async () => {
    const res = await api("post", "/orders", ctx.adminToken).send(
      orderData({ product: "64f1a2b3c4d5e6f708192a3b" }),
    );

    expect(res.status).toBe(404);
  });

  test("invalid order data returns 400", async () => {
    const zero = await api("post", "/orders", ctx.adminToken).send(
      orderData({ quantity: 0 }),
    );
    const missing = await api("post", "/orders", ctx.adminToken).send({
      product: scenario.product._id,
    });

    expect(zero.status).toBe(400);
    expect(missing.status).toBe(400);
  });

  test("an operator cannot create an order", async () => {
    const res = await api("post", "/orders", ctx.operatorToken).send(
      orderData(),
    );
    expect(res.status).toBe(403);
  });

  test("a planned order can be updated", async () => {
    const order = await createOrder(ctx.adminToken, orderData());

    const res = await api("patch", `/orders/${order._id}`, ctx.adminToken).send(
      {
        quantity: 25,
      },
    );

    expect(res.status).toBe(200);
    expect(res.body.data.order.quantity).toBe(25);
  });

  test("the product of an order cannot be changed", async () => {
    const order = await createOrder(ctx.adminToken, orderData());

    const res = await api("patch", `/orders/${order._id}`, ctx.adminToken).send(
      {
        product: scenario.product._id,
      },
    );

    expect(res.status).toBe(400);
  });

  test("a planned order can be cancelled and then cannot be changed", async () => {
    const order = await createOrder(ctx.adminToken, orderData());

    const cancelled = await api(
      "post",
      `/orders/${order._id}/cancel`,
      ctx.adminToken,
    );
    const cancelAgain = await api(
      "post",
      `/orders/${order._id}/cancel`,
      ctx.adminToken,
    );
    const update = await api(
      "patch",
      `/orders/${order._id}`,
      ctx.adminToken,
    ).send({
      quantity: 5,
    });

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.order.status).toBe("annulé");
    expect(cancelAgain.status).toBe(409);
    expect(update.status).toBe(409);
  });

  test("filters by status and by product", async () => {
    const first = await createOrder(ctx.adminToken, orderData());
    await createOrder(ctx.adminToken, orderData());
    await api("post", `/orders/${first._id}/cancel`, ctx.adminToken);

    const planned = await api(
      "get",
      `/orders?status=${encodeURIComponent("planifié")}`,
      ctx.adminToken,
    );
    const byProduct = await api(
      "get",
      `/orders?product=${scenario.product._id}`,
      ctx.adminToken,
    );
    const otherProduct = await api(
      "get",
      "/orders?product=64f1a2b3c4d5e6f708192a3b",
      ctx.adminToken,
    );

    expect(planned.body.data.pagination.total).toBe(1);
    expect(byProduct.body.data.pagination.total).toBe(2);
    expect(otherProduct.body.data.pagination.total).toBe(0);
  });

  test("filters by period", async () => {
    await createOrder(ctx.adminToken, orderData());

    const inside = await api(
      "get",
      "/orders?from=2000-01-01&to=2100-01-01",
      ctx.adminToken,
    );
    const future = await api("get", "/orders?from=2100-01-01", ctx.adminToken);

    expect(inside.body.data.pagination.total).toBe(1);
    expect(future.body.data.pagination.total).toBe(0);
  });

  test("invalid filters and pagination return 400", async () => {
    const limit = await api("get", "/orders?limit=abc", ctx.adminToken);
    const page = await api("get", "/orders?page=0", ctx.adminToken);
    const status = await api("get", "/orders?status=xyz", ctx.adminToken);
    const period = await api(
      "get",
      "/orders?from=2100-01-01&to=2000-01-01",
      ctx.adminToken,
    );
    const date = await api("get", "/orders?from=not-a-date", ctx.adminToken);

    expect(limit.status).toBe(400);
    expect(page.status).toBe(400);
    expect(status.status).toBe(400);
    expect(period.status).toBe(400);
    expect(date.status).toBe(400);
  });

  test("an operator cannot list all orders", async () => {
    const res = await api("get", "/orders", ctx.operatorToken);
    expect(res.status).toBe(403);
  });

  test("mine returns only the orders of the current operator", async () => {
    const other = await createUser({
      name: "Other",
      email: "other@test.local",
      password: "Other12345",
      role: "Operator",
    });
    await createOrder(ctx.adminToken, orderData());
    await createOrder(
      ctx.adminToken,
      orderData({ assignedTo: String(other._id) }),
    );

    const res = await api("get", "/orders/mine", ctx.operatorToken);

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.items[0].assignedTo._id).toBe(ctx.operatorId);
  });

  test("mine does not accept an assignedTo filter from the request", async () => {
    const res = await api(
      "get",
      "/orders/mine?assignedTo=64f1a2b3c4d5e6f708192a3b",
      ctx.operatorToken,
    );

    expect(res.status).toBe(400);
  });

  test("an admin cannot use mine", async () => {
    const res = await api("get", "/orders/mine", ctx.adminToken);
    expect(res.status).toBe(403);
  });

  test("an operator reads their own order and gets 404 for another one", async () => {
    await createUser({
      name: "Other",
      email: "other@test.local",
      password: "Other12345",
      role: "Operator",
    });
    const otherToken = await login("other@test.local", "Other12345");
    const order = await createOrder(ctx.adminToken, orderData());

    const own = await api("get", `/orders/${order._id}`, ctx.operatorToken);
    const foreign = await api("get", `/orders/${order._id}`, otherToken);
    const admin = await api("get", `/orders/${order._id}`, ctx.adminToken);

    expect(own.status).toBe(200);
    expect(foreign.status).toBe(404);
    expect(admin.status).toBe(200);
  });

  test("a missing token returns 401", async () => {
    const res = await api("get", "/orders/mine");
    expect(res.status).toBe(401);
  });
});
