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
    "@typescript-eslint/no-explicit-any": "error",
    // AGENTS.md regra 8: dinheiro é inteiro em centavos (bigint), nunca float.
    // .toFixed() sobre valor monetario e o bug classico de arredondamento de ponto
    // flutuante em cima de dinheiro (ja aconteceu uma vez no dashboard), por isso
    // banido no repo inteiro. Number()/parseFloat() sao permitidos fora do dominio
    // monetario (ex: parsear porta de env), entao ficam restritos abaixo aos
    // arquivos que efetivamente calculam dinheiro (packages/core/pricing e o schema).
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.property.name='toFixed']",
        message:
          "toFixed() e proibido (AGENTS.md regra 8: dinheiro e bigint em centavos, nunca float). Formate com matematica inteira."
      }
    ]
  },
  overrides: [
    {
      files: ["packages/core/src/pricing/**/*.ts", "packages/db/src/schema.ts"],
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: "CallExpression[callee.property.name='toFixed']",
            message:
              "toFixed() e proibido (AGENTS.md regra 8: dinheiro e bigint em centavos, nunca float). Formate com matematica inteira."
          },
          {
            selector: "CallExpression[callee.name='Number']",
            message:
              "Number() e proibido em codigo de dinheiro (packages/core/pricing e schema). Dinheiro e bigint em centavos."
          },
          {
            selector: "CallExpression[callee.name='parseFloat']",
            message:
              "parseFloat() e proibido em codigo de dinheiro (packages/core/pricing e schema). Dinheiro e bigint em centavos."
          }
        ]
      }
    }
  ]
};
