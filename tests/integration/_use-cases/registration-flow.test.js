import { version as uuidVersion } from "uuid";

import orchestrator from "tests/orchestrator";
import password from "models/password";
import user from "models/user";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.clearDatabase();
  await orchestrator.runPendingMigrations();
  await orchestrator.deleteAllEmails();
});

describe("Use case: Registration Flow (all sucessful)", () => {
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

    const responseBody = await response.json();

    expect(responseBody).toEqual({
      id: responseBody.id,
      username: "RegistrationFlow",
      email: "RegistrationFlow@gmail.com",
      password: responseBody.password,
      features: ["read:activation_token"],
      created_at: responseBody.created_at,
      updated_at: responseBody.updated_at,
    });

    expect(uuidVersion(responseBody.id)).toBe(4);
    expect(Date.parse(responseBody.created_at)).not.toBeNaN();
    expect(Date.parse(responseBody.updated_at)).not.toBeNaN();

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

  test("Receive activation email", () => {});

  test("Active account", () => {});

  test("Login", () => {});

  test("Get user information", () => {});
});
