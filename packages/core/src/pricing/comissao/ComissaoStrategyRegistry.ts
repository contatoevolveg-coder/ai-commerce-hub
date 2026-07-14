import type { ComissaoStrategy } from './ComissaoStrategy'
import { MercadoLivreStrategy } from './strategies/MercadoLivreStrategy'
import { AmazonStrategy } from './strategies/AmazonStrategy'
import { ShopeeStrategy } from './strategies/ShopeeStrategy'

const registry = new Map<string, ComissaoStrategy>([
  ['mercado_livre', new MercadoLivreStrategy()],
  ['amazon', new AmazonStrategy()],
  ['shopee', new ShopeeStrategy()],
])

export function registrarComissaoStrategy(canalId: string, strategy: ComissaoStrategy): void {
  registry.set(canalId, strategy)
}

export function resolverComissaoStrategy(canalId: string): ComissaoStrategy {
  const strategy = registry.get(canalId)
  if (!strategy) {
    throw new Error(`Nenhuma ComissaoStrategy registrada para o canal "${canalId}"`)
  }
  return strategy
}
