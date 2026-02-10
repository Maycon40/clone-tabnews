import { createRouter } from "next-connect";

import controller from "infra/controller.js";
import migrator from "models/migrator";
import authorization from "models/authorization";

const router = createRouter();

router.use(controller.injectAnonymousOrUser);

router.get(controller.canRequest("read:migration"), getHandler);
router.post(controller.canRequest("create:migration"), postHandler);

export default router.handler(controller.errorHandlers);

async function getHandler(request, response) {
  const userTryingToGet = request.context.user;
  const pendingMigrations = await migrator.listPendingMigrations();

  const secureOutputValues = authorization.filterOutput(
    userTryingToGet,
    "read:migration",
    pendingMigrations,
  );

  return response.status(200).json(secureOutputValues);
}

async function postHandler(request, response) {
  const userTryingToPost = request.context.user;
  const migratedMigrations = await migrator.runPendingMigrations();

  let statusCode = 201;

  if (migratedMigrations.length == 0) {
    statusCode = 200;
  }

  const secureOutputValues = authorization.filterOutput(
    userTryingToPost,
    "read:migration",
    migratedMigrations,
  );

  return response.status(statusCode).json(secureOutputValues);
}
