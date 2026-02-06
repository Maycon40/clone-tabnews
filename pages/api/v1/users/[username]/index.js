import { createRouter } from "next-connect";
import controller from "infra/controller";
import user from "models/user";
import { ForbiddenError } from "infra/errors";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(getHandler);
router.patch(controller.canRequest("update:user"), patchHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const username = request.query.username;
  const userFound = await user.findOneByUsername(username);

  response.status(200).json(userFound);
}

async function patchHandler(request, response) {
  const username = request.query.username;
  const userInputValues = request.body;
  const currentUser = request.context.user;

  const userToUpdate = await user.findOneByUsername(username);

  if (userToUpdate.id != currentUser.id) {
    throw new ForbiddenError({
      message: "Você não tem permissão para alterar outros usuários.",
      action: "Utilize seu nome de usuário para alterar as informações.",
    });
  }

  const updatedUser = await user.updateByUsername(username, userInputValues);

  response.status(200).json(updatedUser);
}
