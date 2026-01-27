import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";
import { ServiceError } from "infra/errors";

const defaultMigrationOptions = {
  dryRun: true,
  dir: join("infra", "migrations"),
  direction: "up",
  log: () => {},
  migrationsTable: "pgmigrations",
};

async function listPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
    });

    return pendingMigrations;
  } catch (error) {
    const migrateObjectError = new ServiceError({
      message: "Erro ao listar as migrações.",
      cause: error,
    });

    throw migrateObjectError;
  } finally {
    await dbClient?.end();
  }
}

async function runPendingMigrations() {
  let dbClient;

  try {
    dbClient = await database.getNewClient();

    const pendingMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dbClient,
      dryRun: false,
    });

    return pendingMigrations;
  } catch (error) {
    const migrateObjectError = new ServiceError({
      message: "Erro ao rodar as migrações.",
      cause: error,
    });

    throw migrateObjectError;
  } finally {
    await dbClient?.end();
  }
}

const migrator = {
  listPendingMigrations,
  runPendingMigrations,
};

export default migrator;
