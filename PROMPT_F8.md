# PROMPT F8 — Bling real (troca mock→real)

> ⚠️ **NÃO cole este prompt no Antigravity ainda.** Esta fase tem uma dependência que não é
> código: precisa de `BLING_CLIENT_ID` e `BLING_CLIENT_SECRET` de uma aplicação registrada no
> painel de desenvolvedor do Bling, em modo sandbox (nunca credencial de produção — proibido
> pelo `AGENTS.md` sem autorização explícita). Sem isso, o Antigravity não tem como nem começar.
>
> Quando as credenciais existirem, cole este prompt. Se ele começar sem elas, a instrução abaixo
> já manda parar e perguntar — mas o ideal é nem chegar nesse ponto.

---

## BLOCO 0 — Sincronização e leitura

0. `git fetch origin feat/f7-motores-valor` (ou o branch da última fase concluída — confirme
   qual é antes de começar) e confirme que seu branch nasce dali.
1. `./AGENTS.md`, `./HISTORICO_PROJETO.md`, `./ANTIGRAVITY_RULES.md`, `./GUARDRAILS.md`,
   `./ROADMAP.md` (seção F8).
2. **Confirme que `BLING_CLIENT_ID`/`BLING_CLIENT_SECRET` (sandbox) foram fornecidos.** Se não
   foram, PARE agora e peça — não implemente nada "preparatório" sem eles.
3. `packages/integrations/src/contracts/erp.ts` (F4.1) — a interface `ErpAdapter` que o adapter
   real precisa satisfazer exatamente. É por isso que o contrato existe: trocar mock→real deve
   ser transparente pro `registry.ts`.
4. `packages/core/src/crypto/credencial.ts` (F5.1) — `cifrar`/`decifrar`, usado aqui pela
   primeira vez de verdade.

## Escopo

1. `packages/integrations/src/real/bling.adapter.ts`: implementa `ErpAdapter` (mesma interface
   do mock) usando a API v3 do Bling. OAuth2 com refresh token automático.
2. Credencial (`client_id`/`client_secret`/tokens OAuth) cifrada com `packages/core/src/crypto/credencial.ts`
   antes de gravar na tabela `credencial` (colunas `payloadCifrado`/`iv`/`authTag` já existem).
   **Nunca logar token, nem no `console.error` de erro de rede.**
3. `CREDENTIAL_ENCRYPTION_KEY` (F5.1) passa a ser **obrigatória** neste ponto — atualize
   `packages/core/src/env.ts` removendo o `.optional()`/`TODO(F8)` (esta é a fase certa pra isso).
   Confirme que a variável está configurada em todos os ambientes (local `.env`, Vercel) **antes**
   de remover o `.optional()`, ou o próximo build quebra (mesmo padrão do incidente do
   `prepare: false`/`dev-tenant.ts` — ver `HISTORICO_PROJETO.md`).
4. `ADAPTER_MODE=real` no ambiente de teste — nunca em produção sem confirmação explícita do
   usuário.
5. Envio controlado: log antes/depois de qualquer escrita real (preço, estoque) — pedido do PO.

## O que esta fase NÃO inclui
Adapter real de outros marketplaces (ML, Amazon, Shopee) — só Bling ERP aqui, conforme
"ERP é fonte da verdade" do princípio do PO.

## DoD
```
pnpm --filter integrations typecheck && lint && test
```
Mais: teste manual contra o sandbox do Bling (não produção), com log antes/depois colado,
confirmando que nenhum token aparece em nenhuma saída.

## Fluxo obrigatório
1. `implementation_plan.md`/`task.md` — pare para aprovação.
2. Branch: `feat/f8-bling-real`.
3. **Não commite** — me chame para auditar antes do commit/PR. Auditoria extra aqui: confirmar
   que nenhuma credencial/token aparece em nenhum arquivo do diff, nem em log.
4. Qualquer dúvida sobre o comportamento real da API do Bling: pare e pergunte, não invente.
