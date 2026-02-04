import orchestrator from "tests/orchestrator";
import { version as uuidVersion } from "uuid";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
});

describe("GET /api/v1/users/[username]", () => {
  describe("Anonymous user", () => {
    test("With exact case match", async () => {
      const createdUser = await orchestrator.createUser();

      const response2 = await fetch(
        `http://localhost:3000/api/v1/users/${createdUser.username}`,
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: createdUser.username,
        email: createdUser.email,
        password: response2Body.password,
        features: [],
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With case mismatch", async () => {
      const createdUser = await orchestrator.createUser({
        username: "differentcase",
      });

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/Differentcase",
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(response2Body).toEqual({
        id: response2Body.id,
        username: "differentcase",
        email: createdUser.email,
        password: response2Body.password,
        features: [],
        created_at: response2Body.created_at,
        updated_at: response2Body.updated_at,
      });

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
    });

    test("With nonexistance username", async () => {
      const response = await fetch(
        "http://localhost:3000/api/v1/users/nonexistanceusername",
      );

      expect(response.status).toBe(404);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O nome de usuário não foi encontrado no sistema.",
        action: "Verifique se o nome de usuário está digitado corretamente.",
        status_code: 404,
      });
    });
  });
});
