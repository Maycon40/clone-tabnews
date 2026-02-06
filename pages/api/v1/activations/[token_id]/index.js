import { createRouter } from "next-connect";
import controller from "infra/controller";
import activation from "models/activation";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.patch(controller.canRequest("read:activation_token"), patchHandler);

export default router.handler(controller.errorHandlers);

async function patchHandler(request, response) {
  const activationTokenId = request.query.token_id;

  await activation.findOneValidById(activationTokenId);

  const activatedToken = await activation.markTokenAsUsed(activationTokenId);

  response.status(200).json(activatedToken);
}
