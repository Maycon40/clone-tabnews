import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.post(controller.canRequest("create:user"), postHandler);

export default router.handler(controller.errorHandlers);

async function postHandler(request, response) {
  const protocol = request.headers["x-forwarded-proto"] ?? "http";
  const host = request.headers.host;
  const origin = `${protocol}://${host}`;

  const userInputValues = request.body;
  const newUser = await user.create(userInputValues);

  const activationToken = await activation.create(newUser.id);
  await activation.sendEmailToUser(newUser, activationToken, origin);

  response.status(201).json(newUser);
}
