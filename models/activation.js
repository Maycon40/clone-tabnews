import database from "infra/database";
import email from "infra/email";
import { NotFoundError } from "infra/errors";

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

async function findOneValidById(tokenId) {
  const token = await runSelectQuery(tokenId);

  return token;

  async function runSelectQuery(tokenId) {
    const results = await database.query({
      text: `
        SELECT
          *
        FROM
          user_activation_tokens
        WHERE
          id = $1
          AND expires_at > NOW()
          AND used_at IS NULL
        LIMIT
          1
      ;`,
      values: [tokenId],
    });

    if (results.rowCount == 0) {
      throw new NotFoundError({
        message: "O token de ativação já foi usado ou está expirado.",
        action: "Realize um novo cadastro",
      });
    }

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
  findOneValidById,
};

export default activation;
