import type { Order } from "../types"

export async function getOrders(): Promise<Order[]> {
  // TODO: Supabase
  return []
}

export async function getOrdersSummary(): Promise<{
  total: number
  pending: number
  shipped: number
  cancelled: number
}> {
  // TODO: Supabase
  return { total: 0, pending: 0, shipped: 0, cancelled: 0 }
}
