import database from "infra/database";
import email from "infra/email";
import { ForbiddenError, NotFoundError } from "infra/errors";
import user from "models/user";
import authorization from "./authorization";

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

async function markTokenAsUsed(tokenId) {
  const activatedToken = await runUpdateQuery(tokenId);

  await activateUserByUserId(activatedToken.user_id);

  return activatedToken;

  async function runUpdateQuery(tokenId) {
    const results = await database.query({
      text: `
        UPDATE
          user_activation_tokens
        SET
          used_at = timezone('utc', now()),
          updated_at = timezone('utc', now())
        WHERE
          id = $1
        RETURNING
          *
        ;
      `,
      values: [tokenId],
    });

    return results.rows[0];
  }

  async function activateUserByUserId(userId) {
    const userToActivate = await user.findOneById(userId);

    if (!authorization.can(userToActivate, "read:activation_token")) {
      throw new ForbiddenError({
        message: "Você não pode mais utilizar tokens de ativação.",
        action: "Entre em contato com o suporte.",
      });
    }

    const activatedUser = await user.setFeatures(userId, [
      "create:session",
      "read:session",
      "update:user",
    ]);

    return activatedUser;
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
  markTokenAsUsed,
  sendEmailToUser,
  findOneValidById,
  EXPIRATION_IN_MILLISECONDS,
};

export default activation;
