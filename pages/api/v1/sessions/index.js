import { createRouter } from "next-connect";

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

  controller.setSessionCookie(response, newSession.token);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  return response.status(201).json(newSession);
}
