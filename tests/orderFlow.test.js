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
  getMaterial,
} = require("./helpers");
const StockMovement = require("../src/models/StockMovement.model");

describe("Starting and finishing orders", () => {
  let ctx;
  let scenario;

  const newOrder = (quantity = 10) =>
    createOrder(ctx.adminToken, {
      product: scenario.product._id,
      quantity,
      assignedTo: ctx.operatorId,
    });

  const start = (id, token = ctx.operatorToken) =>
    api("post", `/orders/${id}/start`, token);
  const finish = (id, token = ctx.operatorToken) =>
    api("post", `/orders/${id}/finish`, token);

  const stockOf = async () => ({
    a: (await getMaterial(ctx.adminToken, scenario.a._id)).quantity,
    b: (await getMaterial(ctx.adminToken, scenario.b._id)).quantity,
  });

  beforeAll(connect);
  afterAll(disconnect);

  beforeEach(async () => {
    await clearDatabase();
    ctx = await setupUsers();
    scenario = await seedScenario(ctx.adminToken);
  });

  test("starting deducts the stock and records one OUT movement per material", async () => {
    const order = await newOrder(10);

    const res = await start(order._id);

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe("en cours");
    expect(res.body.data.order.startedAt).toBeTruthy();
    expect(await stockOf()).toEqual({ a: 80, b: 70 });

    const movements = await StockMovement.find({
      order: order._id,
      type: "OUT",
    });
    const quantities = movements
      .map((movement) => movement.quantity)
      .sort((x, y) => x - y);
    expect(quantities).toEqual([20, 30]);
  });

  test("starting the same order twice returns 409 and deducts only once", async () => {
    const order = await newOrder(10);

    const first = await start(order._id);
    const second = await start(order._id);

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(await stockOf()).toEqual({ a: 80, b: 70 });
  });

  test("two simultaneous starts deduct the stock only once", async () => {
    const order = await newOrder(10);

    const results = await Promise.all([start(order._id), start(order._id)]);
    const statuses = results.map((res) => res.status).sort();

    expect(statuses).toEqual([200, 409]);
    expect(await stockOf()).toEqual({ a: 80, b: 70 });
    expect(await StockMovement.countDocuments({ order: order._id })).toBe(2);
  });

  test("insufficient stock returns 409 and nothing is deducted", async () => {
    const order = await newOrder(40);

    const res = await start(order._id);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain("MAT-B");
    expect(await stockOf()).toEqual({ a: 100, b: 100 });
    expect(await StockMovement.countDocuments({ order: order._id })).toBe(0);

    const after = await api("get", `/orders/${order._id}`, ctx.operatorToken);
    expect(after.body.data.order.status).toBe("planifié");
    expect(after.body.data.order.startedAt).toBeNull();
  });

  test("the stock never becomes negative", async () => {
    const order = await newOrder(1000);

    const res = await start(order._id);
    const stock = await stockOf();

    expect(res.status).toBe(409);
    expect(stock.a).toBeGreaterThanOrEqual(0);
    expect(stock.b).toBeGreaterThanOrEqual(0);
  });

  test("another operator cannot start the order and gets 404", async () => {
    await createUser({
      name: "Other",
      email: "other@test.local",
      password: "Other12345",
      role: "Operator",
    });
    const otherToken = await login("other@test.local", "Other12345");
    const order = await newOrder(10);

    const res = await start(order._id, otherToken);

    expect(res.status).toBe(404);
    expect(await stockOf()).toEqual({ a: 100, b: 100 });
  });

  test("an admin cannot start or finish an order", async () => {
    const order = await newOrder(10);

    const started = await start(order._id, ctx.adminToken);
    const finished = await finish(order._id, ctx.adminToken);

    expect(started.status).toBe(403);
    expect(finished.status).toBe(403);
  });

  test("an unknown order returns 404 and an invalid id returns 400", async () => {
    const unknown = await start("64f1a2b3c4d5e6f708192a3b");
    const invalid = await start("abc");

    expect(unknown.status).toBe(404);
    expect(invalid.status).toBe(400);
  });

  test("an order that has not started cannot be finished", async () => {
    const order = await newOrder(10);

    const res = await finish(order._id);

    expect(res.status).toBe(409);
  });

  test("finishing sets the status and the date and does not change the stock", async () => {
    const order = await newOrder(10);
    await start(order._id);

    const res = await finish(order._id);

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe("terminé");
    expect(res.body.data.order.finishedAt).toBeTruthy();
    expect(await stockOf()).toEqual({ a: 80, b: 70 });
  });

  test("an order cannot be finished twice", async () => {
    const order = await newOrder(10);
    await start(order._id);
    await finish(order._id);

    const res = await finish(order._id);

    expect(res.status).toBe(409);
  });

  test("an order in progress cannot be updated, cancelled or started again", async () => {
    const order = await newOrder(10);
    await start(order._id);

    const update = await api(
      "patch",
      `/orders/${order._id}`,
      ctx.adminToken,
    ).send({
      quantity: 5,
    });
    const cancel = await api(
      "post",
      `/orders/${order._id}/cancel`,
      ctx.adminToken,
    );
    const again = await start(order._id);

    expect(update.status).toBe(409);
    expect(cancel.status).toBe(409);
    expect(again.status).toBe(409);
  });

  test("a cancelled order cannot be started", async () => {
    const order = await newOrder(10);
    await api("post", `/orders/${order._id}/cancel`, ctx.adminToken);

    const res = await start(order._id);

    expect(res.status).toBe(409);
    expect(await stockOf()).toEqual({ a: 100, b: 100 });
  });

  test("history lists only the finished orders of the operator", async () => {
    const finished = await newOrder(5);
    const running = await newOrder(5);
    await newOrder(5);

    await start(finished._id);
    await finish(finished._id);
    await start(running._id);

    const res = await api("get", "/orders/history", ctx.operatorToken);

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.total).toBe(1);
    expect(res.body.data.items[0]._id).toBe(finished._id);
    expect(res.body.data.items[0].status).toBe("terminé");
  });

  test("history is paginated and validates its parameters", async () => {
    const ok = await api(
      "get",
      "/orders/history?page=1&limit=5",
      ctx.operatorToken,
    );
    const bad = await api(
      "get",
      "/orders/history?limit=abc",
      ctx.operatorToken,
    );
    const admin = await api("get", "/orders/history", ctx.adminToken);

    expect(ok.status).toBe(200);
    expect(bad.status).toBe(400);
    expect(admin.status).toBe(403);
  });
});
