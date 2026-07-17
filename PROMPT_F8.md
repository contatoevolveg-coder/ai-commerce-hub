# PROMPT F8 — Bling real (troca mock→real)

> ⚠️ **Antes de colar este prompt no Antigravity**: confirme com o usuário que
> `BLING_CLIENT_ID`/`BLING_CLIENT_SECRET` (de uma aplicação Bling em modo **sandbox**, nunca
> produção sem autorização explícita — proibido pelo `AGENTS.md`) estão disponíveis e configurados
> como variável de ambiente (nunca colados em texto num arquivo do repositório, num prompt, ou
> commitados). Se em algum momento uma credencial Bling passou por chat/log em texto plano,
> rotacione-a no painel do Bling antes de usar em qualquer teste real — trate como comprometida.
> Sem essas credenciais configuradas como env var, o Antigravity não tem como nem começar.

---

## BLOCO 0 — Sincronização e leitura (obrigatório, nesta ordem)

0. `git fetch origin main` e `git log origin/main --oneline -15`. Confirme que seu branch nasce
   do commit mais recente. Sem acesso a fetch: pergunte qual é o commit de referência antes de
   tocar em qualquer arquivo.
1. `./AGENTS.md`, `./HISTORICO_PROJETO.md` (leia até o fim — em especial os Incidentes 4 e 5,
   sobre a chave de criptografia e a conexão com o pooler do Supabase — ambos afetam o caminho
   que o adapter real vai usar), `./ANTIGRAVITY_RULES.md`, `./GUARDRAILS.md`, `./ROADMAP.md`.
2. **Confirme que `BLING_CLIENT_ID`/`BLING_CLIENT_SECRET` (sandbox) estão configurados como env
   var**, não em texto em nenhum arquivo. Se não estiverem, PARE agora e peça — não implemente
   nada "preparatório" sem eles.
3. `packages/integrations/src/contracts/erp.ts` (F4.1) — a interface `ErpAdapter` que o adapter
   real precisa satisfazer exatamente, e `packages/integrations/src/mock/bling.mock.ts` (o mock
   atual, para ver o shape de dado esperado) e `packages/integrations/src/registry.ts`
   (`ADAPTER_MODE` já decide mock vs real — trocar deve ser transparente pro resto do código).
4. **O cofre de credenciais já existe e já está em produção, testado com uma chave real hoje** —
   não é preparação teórica, é código rodando: `packages/core/src/services/integracoes.service.ts`
   (`salvarCredencialErp`, `obterCredencialErp`, `listarConexoesErp`, `validarCredenciais`) grava
   na tabela `conexao_erp` (`packages/db/src/schema/integracao.ts`), cifrado com AES-256-GCM
   (`packages/core/src/crypto/credencial.ts`). **O adapter real desta fase DEVE chamar
   `obterCredencialErp` para pegar as credenciais do tenant — não crie um caminho de
   armazenamento/cripto paralelo.** A tela `/config` (`apps/web/components/config/ErpIntegracoes.tsx`)
   já permite ao usuário conectar um Bling (rótulo, clientId, clientSecret) e já funciona
   ponta a ponta — o que falta é só o adapter usar essas credenciais para falar com a API real.
5. `CREDENTIAL_ENCRYPTION_KEY` **já é obrigatória e já está configurada em produção** (Vercel) —
   não há `.optional()` para remover, isso já foi feito. `obterChave()` em `integracoes.service.ts`
   já faz `.trim()` e valida 32 bytes, lançando `ChaveCriptografiaAusenteError` (503) com mensagem
   clara em caso de problema — reuse esse padrão de erro, não invente um novo.

## Escopo

1. `packages/integrations/src/real/bling.adapter.ts`: implementa `ErpAdapter` (mesma interface do
   mock) usando a API v3 do Bling. OAuth2 com refresh token automático. O `clientId`/`clientSecret`
   usados para iniciar o fluxo OAuth vêm de `obterCredencialErp(clienteId, conexaoId)` — nunca de
   env var direto (env var é só para o app Bling em si, não para credencial de tenant).
2. Tokens OAuth (access/refresh) resultantes do fluxo também devem ser cifrados antes de persistir
   — reuse `cifrar`/`decifrar` de `packages/core/src/crypto/credencial.ts`. Decida junto com o
   usuário se isso atualiza a mesma linha de `conexao_erp` (novo payload cifrado) ou uma tabela
   nova — não invente o shape sozinho, é ambíguo o suficiente para perguntar.
3. **Nunca logar token, client_secret, ou qualquer payload de credencial** — nem em
   `console.error` de erro de rede (mesmo padrão já seguido em `integracoes.service.ts`, que nunca
   loga o payload cifrado nem a chave).
4. `ADAPTER_MODE=real` só no ambiente de teste (sandbox do Bling) — nunca em produção sem
   confirmação explícita do usuário.
5. Envio controlado: log antes/depois de qualquer escrita real (preço, estoque) — pedido do PO,
   sem incluir dado sensível no log.
6. Atualize o worker `sync-erp` (se já existir da F6) para usar `ADAPTER_MODE=real` quando
   configurado, sem mudar a interface que ele consome do `registry.ts`.

## O que esta fase NÃO inclui

Adapter real de outros marketplaces (ML, Amazon, Shopee) — só Bling ERP aqui, conforme o
princípio "ERP é fonte da verdade" do `ROADMAP.md`.

## DoD

```
pnpm --filter integrations typecheck && pnpm --filter integrations lint && pnpm --filter integrations test
```
Mais: teste manual contra o sandbox do Bling (nunca produção), com log antes/depois colado,
confirmando visualmente que nenhum token/segredo aparece em nenhuma linha de saída.

## Fluxo obrigatório

1. `implementation_plan.md`/`task.md` — pare para aprovação.
2. Branch: `feat/f8-bling-real`, a partir de `main`.
3. **Não commite** — chame o Claude Code para auditar o diff completo antes do commit/PR.
   Auditoria extra aqui: confirmar que nenhuma credencial/token aparece em nenhum arquivo do
   diff, nem em log, nem em teste.
4. Qualquer dúvida sobre o comportamento real da API do Bling: pare e pergunte, não invente.
