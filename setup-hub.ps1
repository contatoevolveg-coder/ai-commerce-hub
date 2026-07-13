# =============================================================
# AI Commerce Hub — Setup de arquivos de configuração
# Execute com: .\setup-hub.ps1
# Pasta: C:\Users\Marketplace\Desktop\HUB_Agentes_de_ia
# =============================================================

$root = "C:\Users\Marketplace\Desktop\HUB_Agentes_de_ia"
Set-Location $root
Write-Host "`n🚀 Iniciando setup do AI Commerce Hub..." -ForegroundColor Cyan

# -------------------------------------------------------------
# AGENTS.md
# -------------------------------------------------------------
@'
# AGENTS.md — AI Commerce Hub

## Produto
Sistema operacional de IA para operação de e-commerce multicanal (Mercado Livre, Amazon,
Shopee, Magalu, TikTok Shop, Shein, loja própria). Agentes de IA propõem e executam decisões
de preço, estoque, conteúdo e atendimento, sob governança humana com trilha de auditoria.
Usuário: Diretor de Operações de um seller com 800+ SKUs. Multi-tenant desde o dia 1.

## Papel do agente
Senior Full-Stack Engineer (TypeScript). Você escreve código de produção: tipado, testado,
observável e seguro. Não escreve protótipo descartável.

## Stack — não substitua sem me perguntar
- Monorepo: pnpm workspaces + Turborepo
- Web: Next.js (App Router) + React + TypeScript strict + Tailwind + shadcn/ui
- Tabelas: TanStack Table · Gráficos: Recharts · Estado servidor: TanStack Query
- API: Route Handlers (BFF) + camada de serviços isolada em packages/core
- Banco: PostgreSQL + Drizzle ORM + migrations versionadas
- Fila/worker: Redis + BullMQ (processo separado em apps/worker)
- Validação: Zod em TODA fronteira (HTTP, fila, integração externa, env)
- Auth: Auth.js + RBAC (admin, pricing, atendimento, auditor)
- IA: Vercel AI SDK, provider-agnóstico (Anthropic/OpenAI/Gemini via adapter)
- Testes: Vitest (unit) + Playwright (e2e) · Lint: ESLint + Prettier
- Infra local: Docker Compose (postgres, redis, mailhog)

## Estrutura
apps/web              → Next.js (UI + BFF)
apps/worker           → BullMQ workers (agentes de IA, sync, jobs)
packages/core         → domínio: entidades, regras de negócio, casos de uso (zero import de React/Next)
packages/db           → schema Drizzle, migrations, seed
packages/ui           → design system (tokens + componentes) + Storybook
packages/integrations → adapters: bling, mercadolivre, amazon, shopee...

## Regras invioláveis
1. TypeScript strict. `any` é proibido. Use `unknown` + Zod parse.
2. Toda entrada externa é validada com Zod antes de tocar o domínio.
3. Multi-tenancy: toda tabela de negócio tem `cliente_id`. Nenhuma query sem filtro de
   tenant. Ativar Row Level Security no Postgres. Um teste automatizado deve provar que
   o tenant A não lê dados do tenant B.
4. Segredos nunca em código. Credenciais de marketplace/ERP são criptografadas
   (AES-256-GCM) na tabela `credencial`. Nunca logue token, senha ou payload com PII.
5. Toda ação de IA é uma `Decisao` persistida com: proposta, raciocínio, impacto
   financeiro estimado, confiança, agente, versão do prompt, custo em tokens.
   Nada é executado sem passar pela máquina de estados de decisão (ver skill ai-decisions).
6. Audit log é append-only. Sem UPDATE, sem DELETE. Toda mutação de negócio grava evento.
7. Idempotência: todo job e todo webhook usa chave de idempotência (SHA-256 do payload
   canônico). Reprocessar nunca duplica efeito.
8. Dinheiro é inteiro em centavos (bigint), nunca float. Percentuais em basis points.
9. Sem lógica de negócio em componente React. Regra de preço/margem vive em
   packages/core e é testada com Vitest.
10. Design system é lei. Nenhum componente novo com cor, espaçamento ou raio fora dos
    tokens de packages/ui. Não instale bibliotecas de UI adicionais.

## Fluxo de trabalho obrigatório
- Sempre produza `implementation_plan.md` antes de codar e pare para minha aprovação.
- Quebre em tarefas de no máximo ~1h em `task.md`.
- Antes de dizer que terminou, rode e cole o resultado:
  pnpm typecheck && pnpm lint && pnpm test && pnpm build
- Para trabalho de UI: rode o app, navegue com o browser e anexe screenshot de cada
  estado (default, loading, vazio, erro) no `walkthrough.md`.
- Commits em Conventional Commits, em português no corpo. Uma feature = um branch.
- Se encontrar ambiguidade de regra de negócio, pare e pergunte. Não invente taxa,
  comissão ou fórmula de margem.

## Nunca faça sem me perguntar
- Rodar migration destrutiva (drop, truncate, alteração de coluna com perda de dado)
- Alterar .env, docker-compose.yml, ou qualquer coisa em packages/db/migrations já aplicada
- Adicionar dependência nova (proponha e justifique)
- Chamar API externa real de marketplace/ERP com credencial de produção
- git push --force, alterar histórico, ou tocar em branch main

## Idioma
Código, nomes de variáveis, tipos e commits: inglês.
UI, mensagens ao usuário, comentários de domínio e conversa comigo: português do Brasil.
'@ | Set-Content -Path "AGENTS.md" -Encoding UTF8
Write-Host "  ✅ AGENTS.md" -ForegroundColor Green

# -------------------------------------------------------------
# GUARDRAILS.md
# -------------------------------------------------------------
@'
# GUARDRAILS.md — Padrões de falha já observados

Adicione aqui toda vez que um agente errar de forma que não deve se repetir.
O agente lê este arquivo antes de qualquer tarefa.

## Regras de negócio
- Não crie um segundo lugar que calcule margem. A fonte única é packages/core/pricing.
- Não use `float` para dinheiro. Centavos em bigint, percentuais em basis points.
- Não hardcode taxa de marketplace. Ela vive em `canal_tarifa`, versionada por vigência.
- Se faltar uma taxa real, PARE e pergunte. Não invente comissão.

## Código
- Não use `useEffect` para buscar dado do servidor. Use TanStack Query ou Server Component.
- Não crie componente novo se já existe equivalente em packages/ui. Estenda o existente.
- Não coloque lógica de negócio dentro de componente React.
- Não use `any`. Prefira `unknown` + Zod parse na fronteira.

## Banco de dados
- Não gere migration destrutiva sem aprovação explícita.
- Não faça query sem filtro de `cliente_id` em tabela de negócio.
- Não faça UPDATE ou DELETE em `audit_log`. É append-only por design.

## Segurança
- Não logue token, senha, credencial ou qualquer campo com PII.
- Não chame API real de marketplace com credencial de produção durante desenvolvimento.
'@ | Set-Content -Path "GUARDRAILS.md" -Encoding UTF8
Write-Host "  ✅ GUARDRAILS.md" -ForegroundColor Green

# -------------------------------------------------------------
# .antigravityignore
# -------------------------------------------------------------
@'
.env
.env.local
.env.production
.env.staging
secrets/
*.pem
*.key
*.p12
node_modules/
dist/
build/
.next/
*.log
.turbo/
coverage/
'@ | Set-Content -Path ".antigravityignore" -Encoding UTF8
Write-Host "  ✅ .antigravityignore" -ForegroundColor Green

# -------------------------------------------------------------
# .agents/skills/design-system/SKILL.md
# -------------------------------------------------------------
@'
---
name: design-system
description: Use sempre que criar ou alterar qualquer componente de UI, tela, cor,
espaçamento, tabela, gráfico ou estado visual do AI Commerce Hub.
---

# Design System — AI Commerce Hub

Tokens em `packages/ui/src/tokens.ts`. Nenhum valor literal fora daqui.

## Cor (dark mode nativo, único tema)
bg/app            #0B1220   → fundo da aplicação
bg/surface        #111827   → cards, sidebar, modais, header de tabela
bg/surface-raised #161E2E   → popovers, dropdowns, command palette
bg/hover          #1A2334   → hover de linha e item de menu
border/subtle     #1E293B   → divisórias, contorno de card (1px)
border/strong     #334155   → inputs, contorno de elemento focado
text/primary      #F8FAFC   → títulos e números-chave
text/body         #CBD5E1   → corpo, células de tabela
text/muted        #64748B   → labels, timestamps, ajudas
accent/ai         #8B5CF6   → tudo que a IA gerou ou decidiu (semântico, não decorativo)
accent/primary    #3B82F6   → ação primária humana, links
status/success    #22C55E   → margem positiva, sincronizado, aprovado
status/warning    #F59E0B   → estoque em alerta, aguardando aprovação
status/danger     #EF4444   → ruptura, erro de integração, margem negativa

### Regras rígidas
- Preto puro (#000) e branco puro (#FFF) são proibidos.
- Badge = cor de status a 12% de opacidade + texto 100%, sem borda.
- Roxo é semântico: se está roxo, foi a IA. Nada mais usa roxo.
- Cor de status nunca preenche fundo de card ou linha inteira.
- No máximo um gradiente por tela, sutil, só em superfície de destaque.

## Espaço, tipo, forma
- Grid 4px — só valores: 4/8/12/16/24/32/48/64. Nenhum outro.
- Raio: 6px (botão/input/badge), 10px (card/modal), 999px (pill/avatar).
- Fonte: Inter. Mono (JetBrains Mono) só em: SKU, ID, payload, editor de prompt.
- KPI: 32px/600 · H1: 20px/600 · H2: 15px/600 · Body: 14px/400 · Tabela: 13px/400
- Todo número usa `font-variant-numeric: tabular-nums`. Valor monetário alinhado à direita.
- Sem sombra difusa — separação por borda 1px. Sombra só em overlay.
- Transição: 150ms ease-out. Foco: anel 2px accent/primary, offset 2px. Contraste ≥ 4.5:1.

## Componentes obrigatórios (packages/ui)
Button (primary|secondary|ghost|ai|danger + estado loading sem mudar a largura)
Badge, DataTable, KpiCard, EmptyState, ErrorState, Skeleton
AIDecisionCard, ConfidenceMeter, AutonomySlider (1–5), Money, Sku, ChannelIcon, HealthScore

## AIDecisionCard — contrato fixo, sempre nesta ordem
1. Diff visual: valor antigo riscado em text/muted → valor novo em text/primary
2. Raciocínio em linguagem natural (1–2 frases) em bloco com borda esquerda accent/ai
3. Impacto financeiro calculado (± R$ e ± p.p. de margem)
4. Confiança (barra + %)
5. Ações: [Aprovar] [Rejeitar e treinar]
Nunca renderize decisão de IA sem os 5 elementos.

## DataTable — contrato
- Linha: 44px. Header sticky: 40px em bg/surface.
- Chips de filtro removíveis, ordenação por coluna, densidade confortável/compacto.
- Seleção em massa → barra flutuante sobe do rodapé com ações e "N selecionados · limpar".
- Paginação: "1–25 de 847".
- Virtualização acima de 100 linhas.

## Estados obrigatórios em TODA tela
- loading  → skeleton com a forma real do conteúdo. Nunca spinner de página inteira.
- vazio    → ícone + título do que falta + 1 frase + 1 botão de ação. Sem "Ops!".
- erro     → o que quebrou + como resolver + botão de retry.
- degradado → conector offline mostra tarja âmbar só na seção afetada.

## Proibido
Glassmorphism, gradiente em botão, emoji na UI, ilustração decorativa, mascote,
Lorem ipsum, placeholder genérico, mais de uma ação primária por tela, texto < 12px.
'@ | Set-Content -Path ".agents\skills\design-system\SKILL.md" -Encoding UTF8
Write-Host "  ✅ .agents/skills/design-system/SKILL.md" -ForegroundColor Green

# -------------------------------------------------------------
# .agents/skills/ai-decisions/SKILL.md
# -------------------------------------------------------------
@'
---
name: ai-decisions
description: Use ao implementar qualquer agente de IA, execução de agente, fila de
aprovação, autonomia, governança, quarentena ou audit log.
---

# Motor de Decisão de IA

## Máquina de estados (única forma de a IA agir no sistema)
proposed → (auto_approved | pending_review) → approved → executing → executed
                                            ↘ rejected        ↘ failed → (retry | dead_letter)

Toda transição grava em `audit_log` (append-only) com ator, timestamp, payload e motivo.

## Níveis de autonomia (por agente, 1–5)
1 → Apenas sugere, não executa
2 → Executa ação reversível com impacto até R$ 100
3 → Executa com impacto até R$ 500
4 → Executa com impacto até R$ 2.000
5 → Autônomo total dentro dos limites da regra do agente

Acima do limite de impacto → estado `pending_review` (quarentena no Governance Center).
O limite é calculado sobre o **impacto financeiro estimado**, não sobre % de variação.

## Campos obrigatórios em toda `Decisao`
- agente_id
- versao_do_prompt
- modelo (ex: claude-sonnet-4-6)
- input_hash (SHA-256 do input canônico)
- proposta (JSON com o que será feito)
- raciocinio (texto em linguagem natural, 1–3 frases)
- impacto_estimado_centavos (bigint, pode ser negativo = perda)
- confianca (0–100)
- tokens_in, tokens_out
- custo_centavos
- estado (enum da máquina de estados)
- ator_aprovador (null se autônomo)

## Guardrails hard stop (a IA nunca ultrapassa, nem no nível 5)
- Preço nunca abaixo do preço-piso (margem 0% após comissão + taxa fixa + frete + imposto + CMV).
- Preço atacado nunca acima de 97% do preço varejo.
- Variação de preço > 15% em 24h para o mesmo SKU → obrigatoriamente pending_review.
- Kill switch global: flag `ai_execution_enabled` desliga toda execução autônoma em 1 clique.
- Toda execução guarda estado anterior para rollback com 1 clique.

## Custo e limites
- Todo call de LLM registra tokens e custo, agregados por agente/módulo/mês.
- Ao atingir 80% do limite mensal do cliente → alerta.
- Ao atingir 100% → agentes caem para nível 1 (apenas sugerem).

## Rollback
Toda Decisao executada pode ser revertida:
1. O estado anterior é armazenado em `decisao.estado_anterior_json`
2. Rollback grava nova Decisao do tipo "rollback" referenciando a original
3. Ambas ficam visíveis no Audit Log
'@ | Set-Content -Path ".agents\skills\ai-decisions\SKILL.md" -Encoding UTF8
Write-Host "  ✅ .agents/skills/ai-decisions/SKILL.md" -ForegroundColor Green

# -------------------------------------------------------------
# .agents/skills/marketplace-domain/SKILL.md
# -------------------------------------------------------------
@'
---
name: marketplace-domain
description: Use ao implementar cálculo de preço, margem, comissão, frete, imposto,
estoque, integração com Bling ou qualquer marketplace.
---

# Domínio — Marketplaces BR

## Fórmula de margem líquida (fonte única: packages/core/pricing)
margem_liquida = preco_venda
  - comissao(canal, preco, categoria)       → percentual ou matriz peso×faixa
  - taxa_fixa_por_item(canal, preco)        → valor fixo por pedido/item
  - frete(canal, peso_g, preco)             → por faixa de peso e preço
  - imposto(regime_tributario, canal)       → Simples, Lucro Presumido etc.
  - cmv(sku_id)                             → custo da mercadoria vendida

Tudo em centavos (bigint). Nenhuma taxa hardcoded no código.

## Tabela canal_tarifa (versionada por vigência)
Campos: canal_id, categoria, tipo (percentual|fixo|matriz), valor, vigente_de, vigente_ate
A query sempre filtra por data: WHERE vigente_de <= $data AND (vigente_ate IS NULL OR vigente_ate >= $data)
Isso garante que cálculos históricos continuem corretos mesmo após mudança de tarifa.

## Modelo de comissão plugável por canal
Implemente como Strategy Pattern — não como if/switch por canal:
interface ComissaoStrategy { calcular(preco, categoria, peso): bigint }
class MercadoLivreStrategy implements ComissaoStrategy { ... }
class AmazonStrategy implements ComissaoStrategy { ... }
Registre no ComissaoStrategyRegistry por canal_id.

## SKUs de referência (use nos testes e no seed)
INF-1042 · Fone Bluetooth TWS Pro ANC         · custo R$68,40  · preço ML R$189,90
INF-2871 · Suporte Articulado Monitor 27"      · custo R$41,20  · preço ML R$129,90
INF-0553 · Cabo USB-C 100W Nylon 2m           · custo R$8,90   · preço ML R$39,90
INF-3390 · Teclado Mecânico 75% Hot-Swap      · custo R$172,00 · preço ML R$449,00
INF-0917 · Luminária de Mesa LED Dimerizável  · custo R$33,50  · preço ML R$99,90

## Integração com marketplaces
- Adapter por canal em packages/integrations/<canal>
- Interface comum: listProducts, updatePrice, updateStock, fetchOrders
- Rate limit + retry com backoff exponencial + circuit breaker
- Sync incremental por updated_since — nunca full scan
- ProdutoEspelho: guarda estado remoto de cada SKU em cada canal
- Divergência entre local e remoto → evento de reconciliação, não sobrescrita cega

## Bling ERP (API v3)
- OAuth2 com refresh token automático
- Credencial criptografada (AES-256-GCM) na tabela `credencial`
- Nunca logar o token
- Usar sandbox/mock em desenvolvimento — nunca credencial de produção

## Vocabulário do domínio (use nos nomes de variáveis e comentários)
GMV, CMV, margem de contribuição, take rate, comissão, taxa fixa,
frete por faixa, buybox, sales velocity, curva ABC, cobertura em dias,
LTV, CAC, ACOS, preço-piso, preço atacado, preço varejo
'@ | Set-Content -Path ".agents\skills\marketplace-domain\SKILL.md" -Encoding UTF8
Write-Host "  ✅ .agents/skills/marketplace-domain/SKILL.md" -ForegroundColor Green

# -------------------------------------------------------------
# .github/copilot-instructions.md
# -------------------------------------------------------------
@'
Siga integralmente as regras de ./AGENTS.md e das skills em ./.agents/skills/.
'@ | Set-Content -Path ".github\copilot-instructions.md" -Encoding UTF8
Write-Host "  ✅ .github/copilot-instructions.md" -ForegroundColor Green

# -------------------------------------------------------------
# .vscode/extensions.json
# -------------------------------------------------------------
@'
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "drizzle-team.drizzle-vscode",
    "ms-playwright.playwright",
    "usernamehw.errorlens",
    "vitest.explorer",
    "aaron-bond.better-comments",
    "christian-kohler.path-intellisense",
    "mikestead.dotenv"
  ]
}
'@ | Set-Content -Path ".vscode\extensions.json" -Encoding UTF8
Write-Host "  ✅ .vscode/extensions.json" -ForegroundColor Green

# -------------------------------------------------------------
# .vscode/settings.json
# -------------------------------------------------------------
@'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/.turbo": true,
    "**/node_modules": true,
    "**/.next": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.next": true
  },
  "editor.rulers": [100],
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
'@ | Set-Content -Path ".vscode\settings.json" -Encoding UTF8
Write-Host "  ✅ .vscode/settings.json" -ForegroundColor Green

# -------------------------------------------------------------
# Resultado final
# -------------------------------------------------------------
Write-Host "`n✅ Setup concluído! Estrutura criada:" -ForegroundColor Cyan
tree /F $root

Write-Host "`n👉 Próximo passo: abra o VS Code com:" -ForegroundColor Yellow
Write-Host "   code ." -ForegroundColor White
