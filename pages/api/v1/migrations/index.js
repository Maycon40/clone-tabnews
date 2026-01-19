import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(request, response) {
  const dbClient = await database.getNewClient();

  const defaultMigrationOptions = {
    dbClient: dbClient,
    dryRun: true,
    dir: join("infra", "migrations"),
    direction: "up",
    verbose: true,
    migrationsTable: "pgmigrations",
  };

  if (request.method == "GET") {
    const pendingMigrations = await migrationRunner(defaultMigrationOptions);

    await dbClient.end();

    return response.status(200).json(pendingMigrations);
  } else if (request.method == "POST") {
    const migratedMigrations = await migrationRunner({
      ...defaultMigrationOptions,
      dryRun: false,
    });

    let statusCode = 201;

    if (migratedMigrations.length == 0) {
      statusCode = 200;
    }

    await dbClient.end();

    return response.status(statusCode).json(migratedMigrations);
  }

  return response.status(405).end();
}
