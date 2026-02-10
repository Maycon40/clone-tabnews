import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/status", () => {
  describe("Privileged user", () => {
    test("Verifying current system status", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);
      await orchestrator.addFeaturesToUser(createdUser.id, ["read:status:all"]);

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(responseBody.dependencies.database.version).toEqual("16.0");
      expect(
        responseBody.dependencies.database.max_connections,
      ).toBeGreaterThan(0);
      expect(
        responseBody.dependencies.database.used_connections,
      ).toBeLessThanOrEqual(responseBody.dependencies.database.max_connections);
    });
  });

  describe("Default user", () => {
    test("Verifying current system status", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/status", {
        headers: {
          Cookie: `session_id=${userSession.token}`,
        },
      });

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(
        responseBody.dependencies.database.max_connections,
      ).toBeGreaterThan(0);
      expect(
        responseBody.dependencies.database.used_connections,
      ).toBeLessThanOrEqual(responseBody.dependencies.database.max_connections);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });

  describe("Anonymous user", () => {
    test("Verifying current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status");

      expect(response.status).toBe(200);

      const responseBody = await response.json();

      const parsedUpdatedAt = new Date(responseBody.updated_at).toISOString();
      expect(responseBody.updated_at).toEqual(parsedUpdatedAt);

      expect(
        responseBody.dependencies.database.max_connections,
      ).toBeGreaterThan(0);
      expect(
        responseBody.dependencies.database.used_connections,
      ).toBeLessThanOrEqual(responseBody.dependencies.database.max_connections);
      expect(responseBody.dependencies.database).not.toHaveProperty("version");
    });
  });
});
