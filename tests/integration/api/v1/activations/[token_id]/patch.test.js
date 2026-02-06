import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator";
import user from "models/user";
import activation from "models/activation";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("PATCH /api/v1/sessions", () => {
  let createdUser;
  let activationId;

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

      createdUser = await response.json();

      const lastEmail = await orchestrator.getLastEmail();

      activationId = orchestrator.extractUUID(lastEmail.text);

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
      const expiresAt = new Date(responseBodyActivation.expires_at);

      const createdAt = new Date(responseBodyActivation.created_at);

      expect(
        orchestrator.verifyDateDifference(
          createdAt,
          expiresAt,
          activation.EXPIRATION_IN_MILLISECONDS,
        ),
      ).toBe(true);

      expect(
        responseBodyActivation.updated_at == responseBodyActivation.used_at,
      ).toBe(true);

      const activatedUser = await user.findOneByUsername(createdUser.username);

      expect(activatedUser.features).toEqual([
        "create:session",
        "read:session",
      ]);
    });

    test("Without permission", async () => {
      const createdSession = await orchestrator.createSession(createdUser.id);

      const responseActivation = await fetch(
        `http://localhost:3000/api/v1/activations/${activationId}`,
        {
          headers: {
            Cookie: `session_id=${createdSession.token}`,
          },
          method: "PATCH",
        },
      );

      expect(responseActivation.status).toBe(403);

      const responseBody = await responseActivation.json();

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
    test("With nonexistent token", async () => {
      const responseActivation = await fetch(
        `http://localhost:3000/api/v1/activations/225d8ebb-56b1-4db9-9d59-53c0d55963f4`,
        {
          method: "PATCH",
        },
      );

      expect(responseActivation.status).toBe(404);

      const responseBody = await responseActivation.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O token de ativação já foi usado ou está expirado.",
        action: "Realize um novo cadastro",
        status_code: 404,
      });
    });

    test("With expired token", async () => {
      jest.useFakeTimers({
        now: new Date(Date.now() - activation.EXPIRATION_IN_MILLISECONDS),
      });

      const activationId2 = (await orchestrator.createActivation(createdUser))
        .id;

      jest.useRealTimers();

      const responseActivation = await fetch(
        `http://localhost:3000/api/v1/activations/${activationId2}`,
        {
          method: "PATCH",
        },
      );

      expect(responseActivation.status).toBe(404);

      const responseBody = await responseActivation.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O token de ativação já foi usado ou está expirado.",
        action: "Realize um novo cadastro",
        status_code: 404,
      });
    });

    test("With already used activation token", async () => {
      const responseActivation = await fetch(
        `http://localhost:3000/api/v1/activations/${activationId}`,
        {
          method: "PATCH",
        },
      );

      expect(responseActivation.status).toBe(404);

      const responseBody = await responseActivation.json();

      expect(responseBody).toEqual({
        name: "NotFoundError",
        message: "O token de ativação já foi usado ou está expirado.",
        action: "Realize um novo cadastro",
        status_code: 404,
      });
    });

    test("Without permission", async () => {
      const activationId2 = (await orchestrator.createActivation(createdUser))
        .id;

      const responseActivation = await fetch(
        `http://localhost:3000/api/v1/activations/${activationId2}`,
        {
          method: "PATCH",
        },
      );

      expect(responseActivation.status).toBe(403);

      const responseBody = await responseActivation.json();

      expect(responseBody).toEqual({
        name: "ForbiddenError",
        message: "Você não pode mais utilizar tokens de ativação.",
        action: "Entre em contato com o suporte.",
        status_code: 403,
      });
    });
  });
});
