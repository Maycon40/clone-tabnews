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
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "samecase",
          email: "samecase@gmail.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/samecase",
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
      expect(response2Body.username).toBe("samecase");
      expect(response2Body.email).toBe("samecase@gmail.com");
      expect(response2Body.password).toBe("senha123");
    });

    test("With case mismatch", async () => {
      const response1 = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "differentcase",
          email: "differentcase@gmail.com",
          password: "senha123",
        }),
      });

      expect(response1.status).toBe(201);

      const response2 = await fetch(
        "http://localhost:3000/api/v1/users/Differentcase",
      );

      expect(response2.status).toBe(200);

      const response2Body = await response2.json();

      expect(uuidVersion(response2Body.id)).toBe(4);
      expect(Date.parse(response2Body.created_at)).not.toBeNaN();
      expect(Date.parse(response2Body.updated_at)).not.toBeNaN();
      expect(response2Body.username).toBe("differentcase");
      expect(response2Body.email).toBe("differentcase@gmail.com");
      expect(response2Body.password).toBe("senha123");
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
