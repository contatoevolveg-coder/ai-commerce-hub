import type { AnalyticsData } from "../types"

export async function getAnalytics(period: string): Promise<AnalyticsData> {
  // TODO: Supabase
  return { revenue: [], ordersByChannel: [], conversion: [], topProducts: [] }
}
