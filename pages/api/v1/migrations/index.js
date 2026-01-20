import migrationRunner from "node-pg-migrate";
import { join } from "node:path";
import database from "infra/database";

export default async function migrations(request, response) {
  let dbClient;
  const methodsAllowed = ["GET", "POST"];

  try {
    dbClient = await database.getNewClient();
    if (!methodsAllowed.includes(request.method)) {
      return response.status(405).end();
    }

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

      return response.status(statusCode).json(migratedMigrations);
    }
  } catch (error) {
    throw error;
  } finally {
    await dbClient.end();
  }
}
