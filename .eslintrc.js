module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  env: {
    node: true,
    browser: true,
    es2021: true
  },
  ignorePatterns: ["dist", ".next", "node_modules", "out", "coverage"],
  rules: {
    "@typescript-eslint/no-explicit-any": "error"
  }
};
