import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator";
import password from "models/password";
import user from "models/user";
import activation from "models/activation";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all sucessful)", () => {
  let createUserResponseBody;
  let activationTokenId;

  test("Create user account", async () => {
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

    createUserResponseBody = await response.json();

    expect(createUserResponseBody).toEqual({
      id: createUserResponseBody.id,
      username: "RegistrationFlow",
      email: "RegistrationFlow@gmail.com",
      password: createUserResponseBody.password,
      features: ["read:activation_token"],
      created_at: createUserResponseBody.created_at,
      updated_at: createUserResponseBody.updated_at,
    });

    expect(uuidVersion(createUserResponseBody.id)).toBe(4);
    expect(Date.parse(createUserResponseBody.created_at)).not.toBeNaN();
    expect(Date.parse(createUserResponseBody.updated_at)).not.toBeNaN();

    const userInDatabase = await user.findOneByUsername("RegistrationFlow");
    const correctPasswordMatch = await password.compare(
      "RegistrationFlowPassword",
      userInDatabase.password,
    );
    const incorrectPasswordMatch = await password.compare(
      "RegistrAtionFlowPassword",
      userInDatabase.password,
    );

    expect(correctPasswordMatch).toBe(true);
    expect(incorrectPasswordMatch).toBe(false);
  });

  test("Receive activation email", async () => {
    const lastEmail = await orchestrator.getLastEmail();

    activationTokenId = orchestrator.extractUUID(lastEmail.text);

    const activationToken =
      await activation.findOneValidById(activationTokenId);

    expect(lastEmail).toEqual({
      id: 1,
      sender: "<contato@gmail.com>",
      recipients: ["<RegistrationFlow@gmail.com>"],
      subject: "Ative o seu cadastro",
      text: lastEmail.text,
      size: lastEmail.size,
      created_at: lastEmail.created_at,
    });

    expect(lastEmail.text).toContain("RegistrationFlow");
    expect(lastEmail.text).toContain(
      `http://localhost:3000/register/activate/${activationToken.id}`,
    );

    expect(createUserResponseBody.id).toBe(activationToken.user_id);
    expect(activationToken.used_at).toBe(null);
  });

  test("Active account", async () => {
    const responseActivation = await fetch(
      `http://localhost:3000/api/v1/activations/${activationTokenId}`,
      {
        method: "PATCH",
      },
    );

    expect(responseActivation.status).toBe(200);

    const responseBodyActivation = await responseActivation.json();

    expect(Date.parse(responseBodyActivation.used_at)).not.toBeNaN();

    const activatedUser = await user.findOneByUsername(
      createUserResponseBody.username,
    );

    expect(activatedUser.features).toEqual(["create:session"]);
  });

  test("Login", () => {});

  test("Get user information", () => {});
});
