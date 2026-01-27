import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
});

describe("POST /api/v1/status", () => {
  describe("Anonymous user", () => {
    test("Verifying current system status", async () => {
      const response = await fetch("http://localhost:3000/api/v1/status", {
        method: "POST",
      });

      expect(response.status).toBe(405);

      const responseBody = await response.json();

      expect(responseBody).toEqual({
        name: "MethoNotAllowedError",
        message: "Método não permitido para esse endpoint.",
        action:
          "Verifique se o método HTTP enviado é valido para esse endpoint.",
        status_code: 405,
      });
    });
  });
});
