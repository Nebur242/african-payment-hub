import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  {
    overrides: [
      {
        files: ["tests/**/*"],
        plugins: ["jest"],
        env: {
          "jest/globals": true,
        },
      },
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
