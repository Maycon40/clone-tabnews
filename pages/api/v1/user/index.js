import { createRouter } from "next-connect";

import controller from "infra/controller";
import session from "models/session";
import user from "models/user";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(controller.canRequest("read:session"), getHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const sessionToken = request.cookies.session_id;

  const sessionObject = await session.findOneValidByToken(sessionToken);
  await session.renew(sessionObject.id);

  const userFound = await user.findOneById(sessionObject.user_id);

  controller.setSessionCookie(response, sessionObject.token);

  response.setHeader(
    "Cache-Control",
    "no-store, no-cache, max-age=0, must-revalidate",
  );

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user:self",
    userFound,
  );

  response.status(200).json(secureOutputValues);
}
