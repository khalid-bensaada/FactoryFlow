const {
  api,
  connect,
  disconnect,
  clearDatabase,
  setupUsers,
} = require("./helpers");

describe("Auth and users", () => {
  let ctx;

  beforeAll(connect);
  afterAll(disconnect);

  beforeEach(async () => {
    await clearDatabase();
    ctx = await setupUsers();
  });

  test("login returns a token and the user without password", async () => {
    const res = await api("post", "/auth/login").send({
      email: "admin@test.local",
      password: "Admin12345",
    });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe("admin@test.local");
    expect(res.body.data.user.password).toBeUndefined();
  });

  test("wrong password and unknown email return the same 401 message", async () => {
    const wrongPassword = await api("post", "/auth/login").send({
      email: "admin@test.local",
      password: "WrongPassword1",
    });
    const unknownEmail = await api("post", "/auth/login").send({
      email: "nobody@test.local",
      password: "Admin12345",
    });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message);
  });

  test("login with an invalid body returns 400", async () => {
    const res = await api("post", "/auth/login").send({
      email: "not-an-email",
    });
    expect(res.status).toBe(400);
  });

  test("me without a token returns 401", async () => {
    const res = await api("get", "/auth/me");
    expect(res.status).toBe(401);
  });

  test("me with a malformed token returns 401", async () => {
    const res = await api("get", "/auth/me", "not.a.token");
    expect(res.status).toBe(401);
  });

  test("me with a valid token returns the profile without password", async () => {
    const res = await api("get", "/auth/me", ctx.operatorToken);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe("operator@test.local");
    expect(res.body.data.user.role).toBe("Operator");
    expect(res.body.data.user.password).toBeUndefined();
  });

  test("admin creates an operator and the new operator can log in", async () => {
    const created = await api("post", "/users", ctx.adminToken).send({
      name: "New Operator",
      email: "new@test.local",
      password: "NewOperator1",
    });

    expect(created.status).toBe(201);
    expect(created.body.data.user.role).toBe("Operator");
    expect(created.body.data.user.password).toBeUndefined();

    const loggedIn = await api("post", "/auth/login").send({
      email: "new@test.local",
      password: "NewOperator1",
    });
    expect(loggedIn.status).toBe(200);
  });

  test("the role cannot be sent when creating an operator", async () => {
    const res = await api("post", "/users", ctx.adminToken).send({
      name: "Sneaky",
      email: "sneaky@test.local",
      password: "Sneaky12345",
      role: "Admin",
    });

    expect(res.status).toBe(400);
  });

  test("an operator cannot create users", async () => {
    const res = await api("post", "/users", ctx.operatorToken).send({
      name: "Another",
      email: "another@test.local",
      password: "Another12345",
    });

    expect(res.status).toBe(403);
  });

  test("a duplicate email returns 409", async () => {
    const res = await api("post", "/users", ctx.adminToken).send({
      name: "Duplicate",
      email: "operator@test.local",
      password: "Duplicate123",
    });

    expect(res.status).toBe(409);
  });

  test("a password shorter than 8 characters returns 400", async () => {
    const res = await api("post", "/users", ctx.adminToken).send({
      name: "Short",
      email: "short@test.local",
      password: "123",
    });

    expect(res.status).toBe(400);
  });
});
