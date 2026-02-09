import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("POST /api/v1/migrations", () => {
  describe("Privileged user", () => {
    describe("Running pending migrations", () => {
      test("For the first time", async () => {
        const createdUser = await orchestrator.createUser();
        await orchestrator.activateUser(createdUser.id);
        const userSession = await orchestrator.createSession(createdUser.id);
        await orchestrator.addFeaturesToUser(createdUser.id, [
          "create:migration",
        ]);

        const response1 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${userSession.token}`,
            },
          },
        );
        expect(response1.status).toBe(200);

        const response1Body = await response1.json();

        expect(Array.isArray(response1Body)).toBe(true);
      });

      test("For the second time", async () => {
        const createdUser = await orchestrator.createUser();
        await orchestrator.activateUser(createdUser.id);
        const userSession = await orchestrator.createSession(createdUser.id);
        await orchestrator.addFeaturesToUser(createdUser.id, [
          "create:migration",
        ]);

        const response2 = await fetch(
          "http://localhost:3000/api/v1/migrations",
          {
            method: "POST",
            headers: {
              Cookie: `session_id=${userSession.token}`,
            },
          },
        );
        expect(response2.status).toBe(200);

        const response2Body = await response2.json();

        expect(Array.isArray(response2Body)).toBe(true);
        expect(response2Body.length).toBe(0);
      });
    });
  });

  describe("Default user", () => {
    test("Running pending migrations without permission", async () => {
      const createdUser = await orchestrator.createUser();
      await orchestrator.activateUser(createdUser.id);
      const userSession = await orchestrator.createSession(createdUser.id);

      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
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
    test("Running pending migrations without permission", async () => {
      const response = await fetch("http://localhost:3000/api/v1/migrations", {
        method: "POST",
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
});
