/**
 * Tenant fixo de desenvolvimento/demonstração.
 *
 * Enquanto o Auth.js + RBAC não existem (F5), toda a aplicação opera sobre este
 * cliente_id, semeado por `pnpm db:seed`. O valor é FIXO (não aleatório) pelo mesmo
 * motivo do SEED=42 nos mocks de integração: precisa ser reproduzível entre rodadas
 * e referenciável de fora (a camada BFF em apps/web usa exatamente este id).
 *
 * NUNCA use este id como tenant real em produção. Ver ROADMAP.md F5 (Auth.js) —
 * quando a sessão real existir, `getClienteIdAtual()` em apps/web passa a resolver
 * o tenant da sessão e este id vira só fixture de dev/teste.
 */
export const DEV_CLIENTE_ID = '00000000-0000-0000-0000-000000000001'
