# PROMPT MASTER — F5 até F9 (todas as fases restantes do ROADMAP)

> Leia esta nota antes de colar qualquer coisa no Antigravity.

## Sobre "concluir hoje"

Este documento cobre F5, F6, F7, F8 e F9 na íntegra (o F4.2 já tem prompt próprio em
`PROMPT_F4_2.md` — rode aquele primeiro, esta cadeia começa depois dele). Mas preciso ser
honesto sobre o que "concluir hoje" significa na prática:

- **F5.1 (cripto) + F5.2 (regra_preco/tarefa/Governance) + F5.3 (motor de decisão)** são
  realistas de fechar hoje com qualidade de produção — schema novo é pequeno, e o motor de
  preço/margem que elas reaproveitam já está pronto e testado.
- **F6 (worker BullMQ/Redis) + F7 (motores de estoque/concorrência) + F9 (relatórios/hardening)**
  são muito maiores. Dá para avançar bastante hoje, mas "concluído com o mesmo rigor do resto do
  projeto" em um único dia é otimista — vou marcar onde é razoável parar e continuar amanhã.
- **F8 (Bling real)** tem uma dependência que não é código: precisa de credenciais OAuth2 de uma
  aplicação registrada no Bling (client_id/client_secret) — isso é uma conta/cadastro que só
  você pode criar. **Sem isso, F8 não pode nem começar**, independente de tempo disponível.

A regra 10 do `ANTIGRAVITY_RULES.md` ("trabalhe uma fase por vez, não abra frente de brinde")
continua valendo — foi criada por causa de um incidente real de sobrescrita. Este documento não
pede para pular os portões de aprovação entre fases; ele só encadeia os prompts para você não
precisar escrever um a um. **Cada fase abaixo termina com "PARE aqui e aguarde aprovação" — leve
isso a sério mesmo com pressa de prazo.** Se o dia acabar no meio do F6, é um F6 pela metade e
validado, não seis fases "prontas" sem checagem.

---

# F5.1 — Cripto AES-256-GCM das credenciais

## Leitura
- `packages/db/src/schema/canal.ts` → tabela `credencial` **já existe**: `payloadCifrado`,
  `iv`, `authTag` (colunas já no shape certo, ninguém implementou o cifrador ainda).
- AGENTS.md regra 4: "Segredos nunca em código... nunca logue token, senha ou payload com PII."

## Escopo
1. `packages/core/src/crypto/credencial.ts`:
   - `cifrar(payloadPlano: string, chave: Buffer): { payloadCifrado: string; iv: string; authTag: string }`
   - `decifrar(payloadCifrado: string, iv: string, authTag: string, chave: Buffer): string`
   - `node:crypto`, algoritmo `aes-256-gcm`, IV aleatório de 12 bytes por operação (nunca reuse
     IV com a mesma chave). Encode IV/authTag/payload em base64 para caber em `text`.
2. Chave vem de `CREDENTIAL_ENCRYPTION_KEY` (32 bytes, base64) — **nova env var**, adicione ao
   schema Zod de `packages/core/src/env.ts` e a `.env.example` com um valor de exemplo gerado
   (documente o comando para gerar uma chave real: `openssl rand -base64 32`).
3. **Nunca** logue `payloadPlano`, a chave, ou o resultado cifrado em texto — nem em erro de
   validação Zod (se o payload falhar parse, logue só o tipo do erro, não o conteúdo).
4. Testes: cifrar→decifrar dá o valor original; IV diferente a cada chamada; `authTag` adulterado
   falha a decifragem (prova que GCM está autenticando, não só cifrando).

## DoD
`pnpm --filter core typecheck && lint && test` verde. **PARE aqui e aguarde aprovação.**

---

# F5.2 — `regra_preco` + `tarefa` + Governance Center

## Leitura
- `packages/db/src/schema/ia.ts` (`decisao`, `estadoDecisaoEnum`) — `tarefa` referencia `decisao`
  quando a origem é IA, mas também precisa existir sozinha (ex. "diagnóstico de cadastro" gera
  tarefa sem decisão de IA por trás).
- `.agents/skills/design-system/SKILL.md` — `AIDecisionCard`, `ConfidenceMeter`, `AutonomySlider`,
  `Money`, `Sku`, `ChannelIcon`, `HealthScore`, `ErrorState`, `KpiCard` são **componentes
  obrigatórios do design system que ainda NÃO existem** em `packages/ui/src/components/` (só
  `Button`, `Badge`, `StatCard`, `MiniChart`, `Input`, `Field`, `BarChart`, `Card`, `EmptyState`,
  `PageHeader`, `Skeleton`, `DataTable` existem hoje). A Governance Center vai precisar de pelo
  menos `AIDecisionCard` — não invente um card ad-hoc fora do design system, construa o
  componente que já está especificado.

## Ajuste obrigatório — schema novo (não existe ainda, não invente shape sozinho, confirme comigo se divergir)

`packages/db/src/schema/governanca.ts` (novo arquivo):

```ts
export const regraPreco = pgTable('regra_preco', {
  id, clienteId,
  canalId: uuid references canal.id (nullable — null = regra global do cliente),
  categoria: text (nullable — null = todas categorias),
  margemMinimaBps: bigint (basis points, nunca float — AGENTS.md regra 8),
  descontoMaximoBps: bigint,
  vigenteDe / vigenteAte: timestamp (mesmo padrão de canal_tarifa — versionado),
  createdAt,
}, tenantIsolationPolicy)

export const tarefa = pgTable('tarefa', {
  id, clienteId,
  tipo: pgEnum novo 'tarefa_tipo' (['aprovacao_decisao', 'diagnostico_cadastro', 'divergencia_estoque', 'outro']),
  titulo, descricao,
  decisaoId: uuid references decisao.id (nullable),
  responsavelId: uuid references usuario.id (nullable — sem responsável = fila geral),
  prazo: timestamp (nullable),
  status: pgEnum novo 'tarefa_status' (['aberta', 'em_andamento', 'concluida', 'cancelada']),
  criadoEm, atualizadoEm,
}, tenantIsolationPolicy)
```

Gere a migration com `pnpm db:generate` (não escreva SQL à mão — o projeto usa drizzle-kit) e
rode `pnpm db:push` contra o Supabase configurado, do mesmo jeito que M1 foi validado.

## Escopo
1. Schema acima + migration + RLS (mesmo padrão de todas as outras 21 tabelas).
2. `packages/core/src/services/governanca.service.ts`: `listarTarefas`, `criarTarefa`,
   `aprovarTarefa` (transiciona `decisao.estado` via a máquina de estados — não deixe a rota HTTP
   fazer isso direto), `rejeitarTarefa`. **Regra explícita do PO/AGENTS.md**: usuário com papel
   `auditor` recebe 403 ao tentar aprovar (auditor só audita, não aprova) — sem Auth.js completo
   ainda (isso é F5 M5, fora do escopo aqui), simule isso lendo um header/env de papel de dev
   documentado como TEMPORÁRIO, mesmo padrão do `DEV_CLIENTE_ID` do F4.2.
3. Componente `AIDecisionCard` em `packages/ui/src/components/AIDecisionCard.tsx` seguindo o
   contrato fixo do design system (diff visual → raciocínio → impacto → confiança → ações), mais
   `ConfidenceMeter` e `Money` (helper de formatação de centavos — **nunca `toFixed()`**, regra 8
   do AGENTS.md, já enforçado por ESLint).
4. Tela nova `apps/web/app/governanca/page.tsx` + item de navegação em `apps/web/components/Shell.tsx`
   (confira o componente atual antes de editar — é adição de item, não reescrita do menu).
5. Toda transição de estado grava em `audit_log` (append-only, já validado no banco).

## DoD
`pnpm typecheck && lint && test && build` verde + `pnpm dev`, screenshot da tela de Governança
com pelo menos uma tarefa mock aprovável em `walkthrough.md`. **PARE aqui e aguarde aprovação.**

---

# F5.3 — Motor de decisão (M3) + guardrails

## Leitura
- `.agents/skills/ai-decisions/SKILL.md` — a especificação inteira já existe (máquina de estados,
  níveis de autonomia 1-5, guardrails hard-stop, campos obrigatórios de `Decisao`). **Não
  reinvente isso, implemente exatamente o que está descrito ali.**
- `packages/core/src/pricing/calcularMargem.ts` já retorna `precoPisoCentavos` (busca binária já
  implementada e testada) — o guardrail de preço-piso é **reuso direto**, não recálculo.

## Escopo
1. `packages/core/src/decisions/maquina-estados.ts`: implementa as transições válidas da máquina
   descrita na skill (`proposed → auto_approved | pending_review → approved → executing →
   executed`, mais os ramos `rejected`/`failed → retry | dead_letter`/`rollback`). Transição
   inválida lança erro explícito — nunca `estado = qualquerCoisa` livre.
2. `packages/core/src/decisions/guardrails.ts`:
   - Preço proposto < `precoPisoCentavos` (via `calcularMargem`) → **hard stop**, decisão nunca
     chega a `auto_approved`, vai direto para rejeitada com motivo.
   - Preço atacado > 97% do preço varejo → hard stop.
   - Variação de preço > 15% em 24h no mesmo SKU (consulta `decisao`/`produto_espelho` recentes)
     → força `pending_review`, mesmo em nível de autonomia 5.
   - Kill switch: flag `ai_execution_enabled` por cliente (nova coluna em `cliente` ou tabela
     `configuracao` — decida o menor shape que resolve, registre a escolha no
     `implementation_plan.md`) — quando desligada, toda decisão nova cai em `pending_review`
     independente de autonomia.
   - Limite de impacto financeiro por nível de autonomia (1: só sugere · 2: até R$100 · 3: até
     R$500 · 4: até R$2.000 · 5: sem limite de valor, mas ainda sob os hard stops acima) —
     acima do limite do nível do agente → `pending_review`.
3. Toda transição grava `audit_log` com ator, payload, motivo (regra 6 AGENTS.md).
4. Toda decisão executada guarda `estado_anterior_json` (coluna já existe em `decisao`) —
   implemente o rollback como nova `Decisao` do tipo rollback referenciando a original, não como
   UPDATE destrutivo.
5. Testes: cobertura de cada guardrail hard-stop com um caso que deveria ser bloqueado e um que
   deveria passar — este é o motor mais sensível do projeto (dinheiro + autonomia de IA), não
   aceite menos que isso coberto.

## DoD
`pnpm --filter core typecheck && lint && test` verde, com os testes de guardrail explicitamente
citados na saída colada. **PARE aqui e aguarde aprovação.** Isto fecha o núcleo de F5 —
neste ponto o projeto está em ~68-71% do MVP (bate com a meta original do `ROADMAP.md`).

---

# F6 — Worker de agentes (BullMQ/Redis)

> A partir daqui, avance o quanto o dia permitir, mas não comprometa DoD por velocidade — F6 mexe
> em infraestrutura nova (processo separado, fila, Redis), é onde erro silencioso é mais caro.

## Escopo
1. `apps/worker/` novo (app separado no monorepo, não pacote) — `package.json` próprio, BullMQ +
   ioredis (já estão no `pnpm-lock.yaml`/deps do root conforme visto em `packages/db` — confirme
   se já estão instalados no monorepo antes de propor instalação nova).
2. Orquestrador mínimo: um job types por agente (`sync-bling`, `sync-mercadolivre`), lê
   `agente` (tabela) por cliente, chama `getErpAdapter`/`getMarketplaceAdapter` (F4.1, mock),
   persiste em `produto`/`estoque`/`produto_espelho` via `withTenant`, gera `execucao_agente` +
   `decisao` quando aplicável (nunca grava direto em tabela de negócio sem passar pela máquina de
   estados do F5.3).
3. Idempotência: chave de idempotência = SHA-256 do payload canônico do job (regra 7 AGENTS.md).
   Reprocessar o mesmo job não pode duplicar `produto`/`pedido`.
4. Kill switch global (F5.3) precisa ser checado pelo worker antes de qualquer execução autônoma.
5. SLA de sync 15-30min é a meta do PO — não precisa de scheduler de produção hoje (cron real),
   mas o job precisa ser re-executável manualmente para provar que o pipeline funciona fim-a-fim.

## Risco a registrar se não fechar hoje
Se parar no meio, documente em `task.md`: até onde o worker roda localmente contra Redis (docker
ou serviço gerenciado), e o que falta para agendamento automático — não deixe isso implícito.

## DoD
Rodar o worker manualmente uma vez, ponta a ponta, contra os mocks do F4.1, e provar via query no
banco que os dados chegaram. **PARE e aguarde aprovação antes do F7.**

---

# F7 — Motores de valor (estoque, concorrência, Smart Pricing, Product 360°)

## Escopo (priorize nesta ordem se o tempo apertar — motor de estoque é o de maior valor imediato)
1. Motor de estoque: ruptura (estoque abaixo de X dias de cobertura), giro, cobertura em dias —
   cálculo puro em `packages/core/src/estoque/`, testado, sem lógica em componente React (regra 9).
2. Modo sandbox/dry-run (pedido explícito do PO): toda ação sensível do motor de decisão (F5.3)
   pode rodar em modo simulação — calcula e mostra o resultado, gera `Decisao` com estado
   `proposed`, mas nunca chega a `executing` a menos que o dry-run seja desligado explicitamente.
   Isto é praticamente grátis se F5.3 já foi bem implementado — é um parâmetro a mais na máquina
   de estados, não um motor novo.
3. Análise de concorrência / Smart Pricing / Product 360°: dependem de dado de concorrente que
   nenhum adapter deste projeto coleta ainda — se chegar aqui, pare e pergunte antes de inventar
   uma fonte de dado fake para "concorrente", isso é exatamente o tipo de ambiguidade de regra de
   negócio que AGENTS.md pede para não resolver sozinho.

## DoD
DoD padrão do monorepo verde para o que foi implementado. **PARE e aguarde aprovação antes do F8/F9.**

---

# F8 — Bling real (troca mock→real)

**Não inicie esta fase sem antes me perguntar por**: `BLING_CLIENT_ID`, `BLING_CLIENT_SECRET` (de
uma aplicação registrada no painel de desenvolvedor do Bling) e confirmação de que é ambiente
sandbox, não produção. Isso é literalmente proibido sem autorização explícita pelo `AGENTS.md`
("Chamar API externa real de marketplace/ERP com credencial de produção" está na lista de
"nunca faça sem me perguntar"). Se essas credenciais não existirem ainda, pule para F9 e volte
aqui depois.

Quando as credenciais existirem: implemente `BlingAdapter` real satisfazendo exatamente a
interface `ErpAdapter` do F4.1 (é por isso que o contrato existe) — o registry já sabe trocar
via `ADAPTER_MODE=real`, nenhum consumidor deveria precisar mudar. OAuth2 com refresh automático,
credencial cifrada com o `packages/core/src/crypto/credencial.ts` do F5.1, nunca logar token.

---

# F9 — Relatórios + Hardening + LGPD

## Escopo
1. Relatórios automáticos: reaproveita os motores de F7 (estoque/margem) para gerar snapshot
   periódico — não é um motor de cálculo novo, é agregação + apresentação do que já existe.
2. Monitoramento de saúde dos conectores: status de última sincronização por `canal`
   (`produto_espelho.ultimaSincronizacao` já existe no schema) — tela ou seção, não infra nova.
3. Hardening: revisão de todas as 20+ policies de RLS (checklist, não código novo — confirme que
   nenhuma tabela de negócio ficou sem `tenantIsolationPolicy`), rotação de
   `CREDENTIAL_ENCRYPTION_KEY` (documentar o procedimento, não precisa automação hoje), headers
   de segurança no Next.js (`next.config.js` — CSP, HSTS, X-Frame-Options).
4. LGPD: nota de retenção/exclusão de dados — para um MVP em pré-produção, isto é
   principalmente **documentação** (política de retenção, endpoint de exclusão de dados de um
   `cliente` sob pedido) mais do que um motor novo. Não superdimensione isto no tempo que sobrar.

## DoD
DoD padrão do monorepo. Esta é a última fase do roadmap atual — ao fechar, atualize o
`ROADMAP.md` com o estado real final do dia (percentual honesto, não arredondado para cima).

---

## Regra de ouro para todas as fases acima

Em cada "PARE aqui": cole a saída real dos comandos, não resuma como "passou tudo". Se alguma
fase não fechar hoje, isso não é falha — é o `task.md` fazendo o trabalho para o qual ele existe:
mostrar exatamente onde continuar amanhã sem perder contexto.
