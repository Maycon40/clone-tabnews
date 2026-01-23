// eslint.config.js

import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import nextVitals from "eslint-config-next/core-web-vitals";
import jest from "eslint-plugin-jest";

export default defineConfig([
  ...nextVitals,
  js.configs.recommended,
  prettierConfig,
  {
    files: ["tests/**"],
    ...jest.configs["flat/recommended"],
    rules: {
      ...jest.configs["flat/recommended"].rules,
      "jest/prefer-expect-assertions": "off",
    },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
