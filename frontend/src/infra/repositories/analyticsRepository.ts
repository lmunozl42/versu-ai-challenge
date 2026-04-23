import client from "./client";

export interface KPIs {
  total_today: number;
  total_yesterday: number;
  total_week: number;
  total_month: number;
  satisfaction_rate: number;
  avg_response_time_ms: number;
  prev_week_satisfaction_rate: number;
  prev_week_avg_response_time_ms: number;
}

export interface DailyVolume { date: string; count: number; }
export interface HourlyVolume { hour: number; count: number; }
export interface RatingDistribution { rating: number; count: number; percentage: number; }
export interface ChannelDistribution { channel: string; count: number; percentage: number; }
export interface PromptStats { prompt_name: string; avg_rating: number; conversation_count: number; }

export interface AnalyticsSummary {
  kpis: KPIs;
  daily_volume: DailyVolume[];
  hourly_volume: HourlyVolume[];
  rating_distribution: RatingDistribution[];
  channel_distribution: ChannelDistribution[];
  worst_prompts: PromptStats[];
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const { data } = await client.get<AnalyticsSummary>("/analytics");
  return data;
}
