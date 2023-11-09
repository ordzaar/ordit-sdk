const path = require("path");

module.exports = {
  parserOptions: { project: [path.join(__dirname, "tsconfig.json")] },
  rules: {
    "no-console": "off",
  },
};
