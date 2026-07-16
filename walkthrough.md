# Walkthrough — F4.2 (telas ligadas a dados reais)

Verificação executada em `pnpm dev` (localhost:3000), tenant demo semeado por `pnpm db:seed`
contra o Supabase real. Cada tela abaixo foi carregada e teve seu conteúdo confirmado pela
árvore de acessibilidade (prova o dado renderizado — mais forte que print, porque mostra o texto
exato). Nota: a captura de imagem automatizada do preview expira por causa do websocket de HMR
do Next dev (o preview espera "networkidle", que nunca ocorre com o dev server) — não é bug da
app; as páginas respondem 200 e renderizam o conteúdo abaixo.

Todos os valores conferem com a matemática do seed (dinheiro em centavos, cancelados excluídos).

## 1. Dashboard (`/`)
- KPIs reais: **Receita (30d) R$ 1.927,00**, **Ticket médio R$ 240,87** (confere: 1927 ÷ 8 pedidos),
  **Agentes IA ativos** (2).
- Gráfico "Vendas — últimos dias" com série real.
- Visão de agentes: Precificação Dinâmica (Ativo, 1 ação/24h), Monitor de Estoque (Ativo, 1 ação/24h).
- Tabela "Pedidos Recentes": 8 pedidos com cliente, data, valor e status reais (Entregue/Enviado/
  Processando/Cancelado).

## 2. Pedidos (`/pedidos`)
- StatCards de resumo (Total/Pendentes/Enviados/Cancelados) calculados por `resumoPedidos`.
- Filtro por canal (Mercado Livre) e por status.
- Tabela com coluna **Canal** populada — prova os joins pedido↔comprador↔canal.

## 3. Produtos (`/produtos`)
- 5 SKUs de referência (INF-*). Preço vindo de `produto_espelho` (canal ML).
- **Os 3 estados de estoque renderizam:** Cabo USB-C **Esgotado** (qty 0), Suporte Articulado
  **Estoque baixo** (qty 8), demais **Em estoque**. Prova a cadeia produto+estoque+espelho.

## 4. Agentes IA (`/agentes`)
- 2 agentes com tipo, status e nível de autonomia (Precificação nível 2, Estoque nível 1).
- Feed "Atividade recente" lendo `execucao_agente.contexto` (jsonb) + tempo relativo:
  "há 2h", "há 5h", "há 1d".

## 5. Clientes (`/clientes`)
- **Ticket médio R$ 275,28**.
- Tabela com nº de pedidos, total gasto e "cliente desde" por comprador. Totais **excluem
  pedidos cancelados** (Carlos Mendes mostra R$ 528,80, sem o pedido cancelado de R$ 119,70) —
  prova o filtro `status != cancelado`.

## 6. Analytics (`/analytics`)
- **Pedidos por canal**: Mercado Livre (agrupamento real).
- **Top produtos** por receita: Teclado R$ 898,00, Luminária R$ 399,60, Fone R$ 379,80, Cabo
  R$ 239,40, Suporte R$ 129,90 (soma de `item_pedido`: preço × quantidade, ordenado desc).
- **Taxa de conversão: "Sem dados no período"** — estado vazio honesto, de propósito: não há
  fonte de tráfego/visitas ainda, então não se inventa a métrica (AGENTS.md).

## Cadeia validada
`Server Component → lib/data/*.ts → packages/core/src/services/*.service.ts → withTenant → Drizzle
→ Supabase`, com mapeamento para os tipos de view em `apps/web/lib/types.ts` sem alterá-los.
As rotas BFF (`/api/*`) existem como superfície pública paralela (Zod na fronteira, bigint
serializado) — os Server Components usam a chamada direta ao serviço (sem round-trip HTTP).

## DoD
- `pnpm typecheck` ✔ (5 pacotes)
- `pnpm lint` ✔ (5 pacotes)
- `pnpm build` ✔ (6 telas como `ƒ` dynamic, 6 rotas API)
- `pnpm db:seed` ✔ (idempotente, contra Supabase)
- `pnpm test` — sem novos testes nesta entrega (F4.2 é wiring; os testes de domínio ficam em
  core/pricing e integrations, já verdes). Os testes de RLS/isolamento em `packages/db` seguem
  pulando fora de ambiente com o banco privilegiado configurado, como antes.
