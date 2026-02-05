import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator";
import user from "models/user";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("PATCH /api/v1/sessions", () => {
  describe("Default user", () => {
    test("With valid session", async () => {
      const response = await fetch("http://localhost:3000/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "RegistrationFlow",
          email: "RegistrationFlow@gmail.com",
          password: "RegistrationFlowPassword",
        }),
      });

      expect(response.status).toBe(201);

      const createdUser = await response.json();

      const lastEmail = await orchestrator.getLastEmail();

      const activationId = orchestrator.extractUUID(lastEmail.text);

      const responseActivation = await fetch(
        `http://localhost:3000/api/v1/activations/${activationId}`,
        {
          method: "PATCH",
        },
      );

      expect(responseActivation.status).toBe(200);

      const responseBodyActivation = await responseActivation.json();

      expect(responseBodyActivation).toEqual({
        id: activationId,
        user_id: createdUser.id,
        used_at: responseBodyActivation.used_at,
        expires_at: responseBodyActivation.expires_at,
        created_at: responseBodyActivation.created_at,
        updated_at: responseBodyActivation.updated_at,
      });

      expect(uuidVersion(responseBodyActivation.id)).toBe(4);
      expect(Date.parse(responseBodyActivation.used_at)).not.toBeNaN();
      expect(Date.parse(responseBodyActivation.expires_at)).not.toBeNaN();
      expect(Date.parse(responseBodyActivation.created_at)).not.toBeNaN();
      expect(Date.parse(responseBodyActivation.updated_at)).not.toBeNaN();

      expect(responseBodyActivation.expires_at > Date.now().toString()).toBe(
        true,
      );

      expect(
        responseBodyActivation.updated_at > responseBodyActivation.created_at,
      ).toBe(true);

      expect(
        responseBodyActivation.updated_at == responseBodyActivation.used_at,
      ).toBe(true);

      const activatedUser = await user.findOneByUsername(createdUser.username);

      expect(activatedUser.features).toEqual(["create:session"]);
    });
  });
});
