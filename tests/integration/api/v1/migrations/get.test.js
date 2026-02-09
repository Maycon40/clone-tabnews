import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/migrations", () => {
  describe("Privileged user", () => {
    test("Verifying pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);
      await orchestrator.addFeaturesToUser(createdUser.id, ["read:migration"]);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      expect(Array.isArray(responseBody)).toBe(true);
    });
  });

  describe("Default user", () => {
    test("Verifying pending migrations", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para realizar esta ação.",
        action:
          "Verifique se o seu usuário possui a permissão necessária para realizar esta ação.",
        status_code: 403,
      });
    });
  });

  describe("Anonymous user", () => {
    test("Verifying pending migrations", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations");

      expect(response.status).toBe(403);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não tem permissão para realizar esta ação.",
        action:
          "Verifique se o seu usuário possui a permissão necessária para realizar esta ação.",
        status_code: 403,
      });
    });
  });
});
