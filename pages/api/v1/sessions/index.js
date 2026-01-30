import { createRouter } from "next-connect";
import * as cookie from "cookie";

import controller from "infra/controller";
import authentication from "models/authentication";
import session from "models/session";

const router = createRouter();

router.post(postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const userInputValues = request.body;

  const authenticatedUser = await authentication.validate(
    userInputValues.email,
    userInputValues.password,
  );

  const newSession = await session.create(authenticatedUser.id);

  const setCookie = cookie.serialize("session_id", newSession.token, {
    path: "/",
    expires: newSession.expires_at,
  });

  response.setHeader("Set-Cookie", setCookie);

  return response.status(201).json(newSession);
}
