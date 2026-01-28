import database from "infra/database";
import { ValidationError } from "infra/errors";

async function create(userInputValues) {
  await validateUniqueUsername(userInputValues.username);

  await valiteUniqueEmail(userInputValues.email);

  const newUser = await runInsertQuery(userInputValues);

  return newUser;

  async function validateUniqueUsername(username) {
    const results = await database.query({
      text: `
    SELECT
      username
    FROM
      users
    WHERE
      LOWER(username) = LOWER($1)
    ;`,
      values: [username],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O nome de usuário já está sendo utilizado.",
        action: "Utilize outro nome de usuário para realizar o cadastro.",
      });
    }
  }

  async function valiteUniqueEmail(email) {
    const results = await database.query({
      text: `
    SELECT
      email
    FROM
      users
    WHERE
      LOWER(email) = LOWER($1)
    ;`,
      values: [email],
    });

    if (results.rowCount > 0) {
      throw new ValidationError({
        message: "O email já está sendo utilizado.",
        action: "Utilize outro email para realizar o cadastro.",
      });
    }
  }

  async function runInsertQuery(userInputValues) {
    const { username, email, password } = userInputValues;

    const results = await database.query({
      text: `
    INSERT INTO
      users (username, email, password)
    VALUES
      ($1, $2, $3)
    RETURNING
      *
    ;`,
      values: [username, email, password],
    });

    return results.rows[0];
  }
}

const user = {
  create,
};

export default user;
