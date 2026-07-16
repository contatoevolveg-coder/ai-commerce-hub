# PROMPT F5.1 — Cripto AES-256-GCM das credenciais

> Cole este prompt inteiro no Antigravity. Ele já inclui o histórico necessário — mas leia
> também `./HISTORICO_PROJETO.md` (mais detalhado) e confirme que bate com o que você vê no
> repositório antes de codar. Se não bater, PARE e avise.

---

## BLOCO 0 — Sincronização e leitura (obrigatório, nesta ordem)

0. `git fetch origin main` e `git log origin/main --oneline -10`. Confirme que o commit mais
   recente é `5475a6e` (ou mais novo). Se seu branch local não tiver esse commit, **pare** —
   você está prestes a trabalhar em cima de estado desatualizado. Isso já aconteceu uma vez
   (ver `HISTORICO_PROJETO.md` → "Incidente 2") e não pode se repetir.
1. `./AGENTS.md` — constituição (regras invioláveis, principalmente a 4: segredos nunca em
   código, credenciais cifradas AES-256-GCM, nunca logar token/senha/PII).
2. `./HISTORICO_PROJETO.md` — o que já existe no projeto, fase a fase.
3. `./ANTIGRAVITY_RULES.md` — regras de edição segura, incluindo a regra 15 (preservar regra
   de negócio ao reescrever) e 16 (nunca `throw` no nível de módulo por env var).
4. `./GUARDRAILS.md` e `./ROADMAP.md` (seção F5.1).

---

## Resumo do que já existe (para você não se perder — detalhe está em HISTORICO_PROJETO.md)

O projeto tem F3 e F4 completas e **em produção ao vivo**
(https://ai-commerce-hub-web.vercel.app): schema de 21 entidades com multi-tenant + RLS validado,
motor de preço/margem puro e testado, contratos + mocks de integração (Bling ERP, Mercado Livre),
camada de serviço (`packages/core/src/services/`) ligando as 6 telas a dados reais do Supabase via
`withTenant()`. A conexão de produção passa pelo **Transaction Pooler** do Supabase (porta 6543)
com `{ prepare: false }` em `packages/db/src/index.ts` — **essa linha é crítica, não remova**.

A tabela `credencial` **já existe** no schema (`packages/db/src/schema/canal.ts`, linhas 67-85),
com as colunas certas para cripto — `payloadCifrado` (text), `iv` (text), `authTag` (text) — mas
**nenhum código de cifragem foi escrito ainda**. É isso que esta fase implementa.

---

## Escopo do F5.1

1. **`packages/core/src/crypto/credencial.ts`** (arquivo novo):
   - `cifrar(payloadPlano: string, chave: Buffer): { payloadCifrado: string; iv: string; authTag: string }`
   - `decifrar(payloadCifrado: string, iv: string, authTag: string, chave: Buffer): string`
   - Use `node:crypto`, algoritmo `aes-256-gcm`. IV **aleatório de 12 bytes a cada chamada de
     `cifrar`** — nunca reutilize IV com a mesma chave (isso quebra a segurança do GCM). Codifique
     `iv`/`authTag`/payload cifrado em base64 para caber nas colunas `text`.
   - Erro de decifragem (ex. `authTag` adulterado) deve lançar um erro claro, não falhar
     silenciosamente.

2. **Env da chave**: adicione `CREDENTIAL_ENCRYPTION_KEY` (string base64, 32 bytes) ao schema Zod
   de `packages/core/src/env.ts` (arquivo já existe, já valida `DATABASE_URL`/`NODE_ENV` — só
   adicione o campo novo, não reescreva o arquivo). Documente em `.env.example` com o comando
   pra gerar uma chave real: `openssl rand -base64 32`. **Nunca** logue o valor da chave.

3. **Nunca logar payload/chave/resultado cifrado** — nem em mensagem de erro de validação Zod
   (se o parse falhar, logue só o tipo do erro, não o conteúdo). Isso é a regra 4 do AGENTS.md.

4. **Testes** (Vitest, em `packages/core/src/crypto/credencial.test.ts`):
   - Cifrar → decifrar retorna o valor original.
   - Duas chamadas de `cifrar` com o mesmo payload e mesma chave produzem `iv` **diferentes**
     (prova que não há reuso de IV).
   - `authTag` adulterado faz `decifrar` lançar erro (prova que GCM está autenticando, não só
     cifrando — sem isso, alguém poderia adulterar o payload cifrado sem detecção).

## O que esta fase NÃO inclui (não abra frente de brinde — regra 10 do ANTIGRAVITY_RULES.md)
- Não implemente ainda o fluxo de salvar/ler credencial real de nenhum canal (Bling, ML) — isso
  é F8. Esta fase é só a função de cifrar/decifrar, testada isoladamente.
- Não crie UI para cadastrar credencial — fora de escopo aqui.
- Não toque em `packages/integrations` — cripto é `packages/core`, adapters ficam como estão.

## DoD
```
pnpm --filter core typecheck && pnpm --filter core lint && pnpm --filter core test
```
Verde, com os 3 testes de cripto explicitamente citados na saída colada.

## Fluxo obrigatório
1. `implementation_plan.md` + `task.md` para esta fase — pare para aprovação antes de codar.
2. Branch: `feat/f5-1-cripto-credenciais`.
3. Ao terminar, cole o DoD completo, rode `git status`/`git diff` e confirme que o diff contém
   **só** `packages/core/src/crypto/*`, `packages/core/src/env.ts`, `.env.example` — nada em
   `packages/db`, `apps/web`, ou nos arquivos de constituição/processo.
4. **Não commite ainda** — este é o ponto de parada para eu (Claude Code) auditar o diff antes
   do merge, conforme o modelo de colaboração combinado (`ANTIGRAVITY_RULES.md` → "Modelo de
   colaboração"). Me avise quando o DoD estiver verde e eu reviso.
5. Ambiguidade de regra de negócio: pare e pergunte, não invente.
