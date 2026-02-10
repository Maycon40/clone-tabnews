import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import { ForbiddenError } from "infra/errors";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:user",
    userFound,
  );

  response.status(200).json(secureOutputValues);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;

  const currentUser = request.context.user;
  const targetUser = await user.findOneByUsername(username);

  if (!authorization.can(currentUser, "update:user", targetUser)) {
    throw new ForbiddenError({
      message: "Você não tem permissão para alterar outro usuário.",
      action:
        "Verifique se você possuí a permissão para atualizar outro usuário.",
    });
  }

  const updatedUser = await user.updateByUsername(username, userInputValues);

  const secureOutputValues = authorization.filterOutput(
    currentUser,
    "read:user",
    updatedUser,
  );

  response.status(200).json(secureOutputValues);
}
