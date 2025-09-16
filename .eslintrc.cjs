module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  env: {
    node: true,
    es2020: true
  },
  rules: {
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off"
  },
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      extends: ["@typescript-eslint/recommended"],
    }
  ],
  ignorePatterns: ["node_modules/", "dist/", ".next/"]
};