import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    rules: {
      "prefer-const": "error",
      "no-constant-binary-expression": "error",
    },
  },
  globalIgnores(["**/.next/*", "**/node_modules/*"]),
]);
