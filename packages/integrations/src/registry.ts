import { env } from './env'
import { ErpAdapter } from './contracts/erp'
import { MarketplaceAdapter } from './contracts/marketplace'
import { BlingMockAdapter } from './mock/bling.mock'
import { MercadoLivreMockAdapter } from './mock/mercadolivre.mock'
import { BlingRealAdapter } from './real/bling.adapter'

export function getErpAdapter(tipo: 'bling'): ErpAdapter {
  if (tipo === 'bling') {
    if (env.ADAPTER_MODE === 'real') {
      return new BlingRealAdapter()
    }
    return new BlingMockAdapter()
  }
  
  throw new Error(`ERP adapter não suportado: ${tipo}`)
}

export function getMarketplaceAdapter(tipo: 'mercadolivre' | 'amazon' | 'shopee'): MarketplaceAdapter {
  if (env.ADAPTER_MODE === 'real') {
    throw new Error(`Adapter real para Marketplace '${tipo}' não está implementado na fase atual.`)
  }
  
  if (tipo === 'mercadolivre') {
    return new MercadoLivreMockAdapter()
  }
  
  // Stubs for Amazon and Shopee if needed
  if (tipo === 'amazon' || tipo === 'shopee') {
    // For now, return the ML mock as a stub for testing the shape, 
    // or throw an error if preferred. We'll return the same mock structure for now.
    return new MercadoLivreMockAdapter()
  }
  
  throw new Error(`Marketplace adapter não suportado: ${tipo}`)
}
