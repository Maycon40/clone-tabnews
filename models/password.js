import bcryptjs from "bcryptjs";

async function hash(password) {
  const rounds = getNumberOfRounds();
  const pepper = process.env.PASSWORD_PEPPER;

  return await bcryptjs.hash(password + pepper, rounds);
}

function getNumberOfRounds() {
  let rounds = 14;

  if (["test", "development"].includes(process.env.NODE_ENV)) {
    rounds = 1;
  }

  return rounds;
}

async function compare(providedPassword, storedPassword) {
  const pepper = process.env.PASSWORD_PEPPER;

  return await bcryptjs.compare(providedPassword + pepper, storedPassword);
}

const password = {
  hash,
  compare,
};

export default password;
