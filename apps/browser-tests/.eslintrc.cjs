const path = require("path");

module.exports = {
  root: true,
  extends: ["./node_modules/@ordzaar/standard-web-linter"],
  parserOptions: { project: [path.join(__dirname, "tsconfig.json")] },
  rules: {
    // Allow better IDE import path resolution
    "import/prefer-default-export": "off",
    "no-console": "off",
    "jsx-a11y/label-has-associated-control": "off",
  },
};
