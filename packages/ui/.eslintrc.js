module.exports = {
  // Sem root:true de propósito: herda as regras do .eslintrc.js da raiz
  // (no-explicit-any, banimento de toFixed) e só adiciona o que é específico
  // deste pacote.
  rules: {
    // Incidente real: uma sessão do Antigravity reintroduziu "@/lib/utils" em
    // componentes de packages/ui. Esse alias resolve contra o tsconfig do app
    // consumidor (apps/web), não deste pacote — quebra o bundle da Vercel mesmo
    // quando `tsc --noEmit` isolado deste pacote passa. Ver GUARDRAILS.md e
    // ANTIGRAVITY_RULES.md. packages/ui só pode importar via caminho relativo.
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["@/*"],
            message:
              "packages/ui nao deve importar via alias @/* do app consumidor (ja quebrou o build da Vercel uma vez). Use import relativo, ex: '../lib/utils'.",
          },
        ],
      },
    ],
  },
}
