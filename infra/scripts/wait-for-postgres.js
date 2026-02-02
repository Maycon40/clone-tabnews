const { Client } = require("pg");
require("dotenv").config({ path: ".env.development" });

async function sleep(msTimeout) {
  await new Promise((resolve) => setTimeout(resolve, msTimeout));
}

async function query(queryObject) {
  let client;

  try {
    client = await getNewClient();
    const result = await client.query(queryObject);
    return result;
  } finally {
    await client?.end();
  }
}

async function getNewClient() {
  const config = {
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl: getValueSSL(),
  };

  const client = new Client(config);

  await client.connect();

  return client;
}

function getValueSSL() {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  return process.env.NODE_ENV == "production" ? true : false;
}

async function checkPostgres() {
  try {
    await query("SELECT 1+1;");
  } catch (error) {
    console.log(error);
    await sleep(1000);
    checkPostgres();
  }
  return;
}

(async () => {
  console.log("Aguardando Postgres aceitar conexões ");
  await checkPostgres();

  console.log("\nPostgres está pronto e aceitando conexões\n");
})();
