const dotenv = require("dotenv");

dotenv.config({
  path: process.env.WATCH === "true" ? ".env.development" : ".env.test",
});

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: ".",
});
const jestConfig = createJestConfig({
  moduleDirectories: ["node_modules", "<rootDir>"],
  testTimeout: 60000,
});

module.exports = jestConfig;
