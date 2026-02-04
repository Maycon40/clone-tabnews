import database from "infra/database";
import email from "infra/email";

const EXPIRATION_IN_MILLISECONDS = 15 * 60 * 1000; // 15 minutes

async function create(userId) {
  const expiresAt = new Date(Date.now() + EXPIRATION_IN_MILLISECONDS);

  const token = await runInsertQuery(userId, expiresAt);

  return token;

  async function runInsertQuery(userId, expiresAt) {
    const results = await database.query({
      text: `
        INSERT INTO
          user_activation_tokens (user_id, expires_at)
        VALUES
          ($1, $2)
        RETURNING
          *
      ;`,
      values: [userId, expiresAt],
    });

    return results.rows[0];
  }
}

async function findOneByUserId(userId) {
  const token = await runSelectQuery(userId);

  return token;

  async function runSelectQuery(userId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          user_id = $1
      ;`,
      values: [userId],
    });

    return results.rows[0];
  }
}

async function sendEmailToUser(user, activationToken, origin) {
  await email.send({
    from: "Contato <contato@gmail.com>",
    to: user.email,
    subject: "Ative o seu cadastro",
    text: `${user.username}, clique no link abaixo para ativar o seu cadastro:

${origin}/register/activate/${activationToken.id}

Atenciosamente,
Equipe`,
  });
}

const activation = {
  create,
  sendEmailToUser,
  findOneByUserId,
};

export default activation;
