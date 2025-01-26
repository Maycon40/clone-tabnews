import { Client } from "pg";

async function query(queryObject) {
  const config = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
  };

  const client = new Client(config);
  await client.connect();
  const result = await client.query(queryObject);
  client.end();

  return result;
}

export default {
  query: query,
};
