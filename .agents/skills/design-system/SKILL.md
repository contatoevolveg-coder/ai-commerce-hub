---
name: design-system
description: Use sempre que criar ou alterar qualquer componente de UI, tela, cor,
espaÃ§amento, tabela, grÃ¡fico ou estado visual do AI Commerce Hub.
---

# Design System â€” AI Commerce Hub

Tokens em `packages/ui/src/tokens.ts`. Nenhum valor literal fora daqui.

## Cor (dark mode nativo, Ãºnico tema)
bg/app            #0B1220   â†’ fundo da aplicaÃ§Ã£o
bg/surface        #111827   â†’ cards, sidebar, modais, header de tabela
bg/surface-raised #161E2E   â†’ popovers, dropdowns, command palette
bg/hover          #1A2334   â†’ hover de linha e item de menu
border/subtle     #1E293B   â†’ divisÃ³rias, contorno de card (1px)
border/strong     #334155   â†’ inputs, contorno de elemento focado
text/primary      #F8FAFC   â†’ tÃ­tulos e nÃºmeros-chave
text/body         #CBD5E1   â†’ corpo, cÃ©lulas de tabela
text/muted        #64748B   â†’ labels, timestamps, ajudas
accent/ai         #8B5CF6   â†’ tudo que a IA gerou ou decidiu (semÃ¢ntico, nÃ£o decorativo)
accent/primary    #3B82F6   â†’ aÃ§Ã£o primÃ¡ria humana, links
status/success    #22C55E   â†’ margem positiva, sincronizado, aprovado
status/warning    #F59E0B   â†’ estoque em alerta, aguardando aprovaÃ§Ã£o
status/danger     #EF4444   â†’ ruptura, erro de integraÃ§Ã£o, margem negativa

### Regras rÃ­gidas
- Preto puro (#000) e branco puro (#FFF) sÃ£o proibidos.
- Badge = cor de status a 12% de opacidade + texto 100%, sem borda.
- Roxo Ã© semÃ¢ntico: se estÃ¡ roxo, foi a IA. Nada mais usa roxo.
- Cor de status nunca preenche fundo de card ou linha inteira.
- No mÃ¡ximo um gradiente por tela, sutil, sÃ³ em superfÃ­cie de destaque.

## EspaÃ§o, tipo, forma
- Grid 4px â€” sÃ³ valores: 4/8/12/16/24/32/48/64. Nenhum outro.
- Raio: 6px (botÃ£o/input/badge), 10px (card/modal), 999px (pill/avatar).
- Fonte: Inter. Mono (JetBrains Mono) sÃ³ em: SKU, ID, payload, editor de prompt.
- KPI: 32px/600 Â· H1: 20px/600 Â· H2: 15px/600 Â· Body: 14px/400 Â· Tabela: 13px/400
- Todo nÃºmero usa `font-variant-numeric: tabular-nums`. Valor monetÃ¡rio alinhado Ã  direita.
- Sem sombra difusa â€” separaÃ§Ã£o por borda 1px. Sombra sÃ³ em overlay.
- TransiÃ§Ã£o: 150ms ease-out. Foco: anel 2px accent/primary, offset 2px. Contraste â‰¥ 4.5:1.

## Componentes obrigatÃ³rios (packages/ui)
Button (primary|secondary|ghost|ai|danger + estado loading sem mudar a largura)
Badge, DataTable, KpiCard, EmptyState, ErrorState, Skeleton
AIDecisionCard, ConfidenceMeter, AutonomySlider (1â€“5), Money, Sku, ChannelIcon, HealthScore

## AIDecisionCard â€” contrato fixo, sempre nesta ordem
1. Diff visual: valor antigo riscado em text/muted â†’ valor novo em text/primary
2. RaciocÃ­nio em linguagem natural (1â€“2 frases) em bloco com borda esquerda accent/ai
3. Impacto financeiro calculado (Â± R$ e Â± p.p. de margem)
4. ConfianÃ§a (barra + %)
5. AÃ§Ãµes: [Aprovar] [Rejeitar e treinar]
Nunca renderize decisÃ£o de IA sem os 5 elementos.

## DataTable â€” contrato
- Linha: 44px. Header sticky: 40px em bg/surface.
- Chips de filtro removÃ­veis, ordenaÃ§Ã£o por coluna, densidade confortÃ¡vel/compacto.
- SeleÃ§Ã£o em massa â†’ barra flutuante sobe do rodapÃ© com aÃ§Ãµes e "N selecionados Â· limpar".
- PaginaÃ§Ã£o: "1â€“25 de 847".
- VirtualizaÃ§Ã£o acima de 100 linhas.

## Estados obrigatÃ³rios em TODA tela
- loading  â†’ skeleton com a forma real do conteÃºdo. Nunca spinner de pÃ¡gina inteira.
- vazio    â†’ Ã­cone + tÃ­tulo do que falta + 1 frase + 1 botÃ£o de aÃ§Ã£o. Sem "Ops!".
- erro     â†’ o que quebrou + como resolver + botÃ£o de retry.
- degradado â†’ conector offline mostra tarja Ã¢mbar sÃ³ na seÃ§Ã£o afetada.

## Proibido
Glassmorphism, gradiente em botÃ£o, emoji na UI, ilustraÃ§Ã£o decorativa, mascote,
Lorem ipsum, placeholder genÃ©rico, mais de uma aÃ§Ã£o primÃ¡ria por tela, texto < 12px.
