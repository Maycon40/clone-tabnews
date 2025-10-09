import database from "infra/database.js";

async function status(request, response) {
  const updatedAt = new Date().toISOString();

  const databaseName = process.env.POSTGRES_DB;

  const maxConnectionsResult = await database.query(`SHOW max_connections;`);
  const usedConnectionsResult = await database.query({
    text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
    values: [databaseName],
  });
  const versionResult = await database.query("SHOW server_version;");

  const { server_version: version } = versionResult.rows[0];

  const { max_connections: maxConnections } = maxConnectionsResult.rows[0];

  const { count: usedConnections } = usedConnectionsResult.rows[0];

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version,
        max_connections: Number(maxConnections),
        used_connections: usedConnections,
      },
    },
  });
}

export default status;
