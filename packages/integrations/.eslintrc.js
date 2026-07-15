module.exports = {
  // Sem root:true de propósito: herda as regras do .eslintrc.js da raiz
  // (no-explicit-any, banimento de toFixed) e só adiciona o que é específico
  // deste pacote.
  rules: {
    // Os adapters mock implementam interfaces de contrato (ErpAdapter,
    // MarketplaceAdapter) que exigem parâmetros como clienteId mesmo quando o
    // mock não precisa deles (retorna dado fixo, sem filtrar por tenant).
    // Prefixo "_" sinaliza "não usado de propósito", sem enfraquecer a regra
    // em outros pacotes.
    "@typescript-eslint/no-unused-vars": [
      "error",
      { argsIgnorePattern: "^_" },
    ],
  },
}
