---
name: marketplace-domain
description: Use ao implementar cÃ¡lculo de preÃ§o, margem, comissÃ£o, frete, imposto,
estoque, integraÃ§Ã£o com Bling ou qualquer marketplace.
---

# DomÃ­nio â€” Marketplaces BR

## FÃ³rmula de margem lÃ­quida (fonte Ãºnica: packages/core/pricing)
margem_liquida = preco_venda
  - comissao(canal, preco, categoria)       â†’ percentual ou matriz pesoÃ—faixa
  - taxa_fixa_por_item(canal, preco)        â†’ valor fixo por pedido/item
  - frete(canal, peso_g, preco)             â†’ por faixa de peso e preÃ§o
  - imposto(regime_tributario, canal)       â†’ Simples, Lucro Presumido etc.
  - cmv(sku_id)                             â†’ custo da mercadoria vendida

Tudo em centavos (bigint). Nenhuma taxa hardcoded no cÃ³digo.

## Tabela canal_tarifa (versionada por vigÃªncia)
Campos: canal_id, categoria, tipo (percentual|fixo|matriz), valor, vigente_de, vigente_ate
A query sempre filtra por data: WHERE vigente_de <= $data AND (vigente_ate IS NULL OR vigente_ate >= $data)
Isso garante que cÃ¡lculos histÃ³ricos continuem corretos mesmo apÃ³s mudanÃ§a de tarifa.

## Modelo de comissÃ£o plugÃ¡vel por canal
Implemente como Strategy Pattern â€” nÃ£o como if/switch por canal:
interface ComissaoStrategy { calcular(preco, categoria, peso): bigint }
class MercadoLivreStrategy implements ComissaoStrategy { ... }
class AmazonStrategy implements ComissaoStrategy { ... }
Registre no ComissaoStrategyRegistry por canal_id.

## SKUs de referÃªncia (use nos testes e no seed)
INF-1042 Â· Fone Bluetooth TWS Pro ANC         Â· custo R$68,40  Â· preÃ§o ML R$189,90
INF-2871 Â· Suporte Articulado Monitor 27"      Â· custo R$41,20  Â· preÃ§o ML R$129,90
INF-0553 Â· Cabo USB-C 100W Nylon 2m           Â· custo R$8,90   Â· preÃ§o ML R$39,90
INF-3390 Â· Teclado MecÃ¢nico 75% Hot-Swap      Â· custo R$172,00 Â· preÃ§o ML R$449,00
INF-0917 Â· LuminÃ¡ria de Mesa LED DimerizÃ¡vel  Â· custo R$33,50  Â· preÃ§o ML R$99,90

## IntegraÃ§Ã£o com marketplaces
- Adapter por canal em packages/integrations/<canal>
- Interface comum: listProducts, updatePrice, updateStock, fetchOrders
- Rate limit + retry com backoff exponencial + circuit breaker
- Sync incremental por updated_since â€” nunca full scan
- ProdutoEspelho: guarda estado remoto de cada SKU em cada canal
- DivergÃªncia entre local e remoto â†’ evento de reconciliaÃ§Ã£o, nÃ£o sobrescrita cega

## Bling ERP (API v3)
- OAuth2 com refresh token automÃ¡tico
- Credencial criptografada (AES-256-GCM) na tabela `credencial`
- Nunca logar o token
- Usar sandbox/mock em desenvolvimento â€” nunca credencial de produÃ§Ã£o

## VocabulÃ¡rio do domÃ­nio (use nos nomes de variÃ¡veis e comentÃ¡rios)
GMV, CMV, margem de contribuiÃ§Ã£o, take rate, comissÃ£o, taxa fixa,
frete por faixa, buybox, sales velocity, curva ABC, cobertura em dias,
LTV, CAC, ACOS, preÃ§o-piso, preÃ§o atacado, preÃ§o varejo
