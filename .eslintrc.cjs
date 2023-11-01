const path = require("path");

module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "./node_modules/@waveshq/standard-prettier",
  ],
  plugins: ["simple-import-sort", "import"],
  parser: "@typescript-eslint/parser",
  rules: {
    "object-shorthand": 2,
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],
    "@typescript-eslint/no-floating-promises": 2,
    "no-shadow": 2,
    "no-param-reassign": 2,
    "no-unneeded-ternary": 2,
    "require-await": 2,
    "simple-import-sort/imports": 2,
    "simple-import-sort/exports": 2,
    "import/first": 2,
    "import/newline-after-import": 2,
    "import/no-duplicates": 2,
    "no-nested-ternary": 2,
    "no-unused-expressions": 2,
    "no-return-assign": 2,
  },
  overrides: [
    {
      files: ["**/src/**/**.spec.ts"],
      rules: {
        "@typescript-eslint/no-floating-promises": 0,
      },
    },
  ],
};
