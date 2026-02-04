import email from "infra/email.js";
import orchestrator from "tests/orchestrator";

beforeAll(async () => {
  await orchestrator.waitForAllServices();
  await orchestrator.deleteAllEmails();
});

describe("infra/email.js", () => {
  test("send()", async () => {
    await email.send({
      from: "Test <test@gmail.com>",
      to: "testTo@gmail.com",
      subject: "Test subject",
      text: "Test body",
    });

    await email.send({
      from: "Test <test@gmail.com>",
      to: "testTo@gmail.com",
      subject: "Last subject",
      text: "Last body",
    });

    const lastEmail = await orchestrator.getLastEmail();

    expect(lastEmail).toEqual({
      id: 2,
      sender: "<test@gmail.com>",
      recipients: ["<testTo@gmail.com>"],
      subject: "Last subject",
      text: "Last body\n",
      size: "281",
      created_at: lastEmail.created_at,
    });
  });
});
