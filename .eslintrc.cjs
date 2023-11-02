const path = require("path");

module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "./node_modules/@ordzaar/standard-linter",
  ],
  parser: "@typescript-eslint/parser",
  rules: {
    // Allow better IDE import path resolution
    "import/prefer-default-export": "off",
  },
};
