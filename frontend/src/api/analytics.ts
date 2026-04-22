import api from "./client";

export interface KPIs {
  total_today: number;
  total_week: number;
  total_month: number;
  satisfaction_rate: number;
  avg_response_time_ms: number;
}

export interface DailyVolume {
  date: string;
  count: number;
}

export interface RatingDistribution {
  rating: number;
  count: number;
  percentage: number;
}

export interface ChannelDistribution {
  channel: string;
  count: number;
  percentage: number;
}

export interface PromptStats {
  prompt_name: string;
  avg_rating: number;
  conversation_count: number;
}

export interface AnalyticsSummary {
  kpis: KPIs;
  daily_volume: DailyVolume[];
  rating_distribution: RatingDistribution[];
  channel_distribution: ChannelDistribution[];
  worst_prompts: PromptStats[];
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>("/analytics");
  return data;
}
