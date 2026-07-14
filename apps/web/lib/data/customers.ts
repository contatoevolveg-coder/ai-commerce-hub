import type { Customer } from "../types"

export async function getCustomers(): Promise<Customer[]> {
  // TODO: Supabase
  return []
}

export async function getCustomersSummary(): Promise<{
  total: number
  new30d: number
  avgTicket: string
}> {
  // TODO: Supabase
  return { total: 0, new30d: 0, avgTicket: "R$ 0,00" }
}
