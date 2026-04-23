import {
  fetchAnalytics,
  type DailyVolume,
  type HourlyVolume,
  type KPIs,
  type AnalyticsSummary,
  type RatingDistribution,
  type ChannelDistribution,
  type PromptStats,
} from "@/infra/repositories/analyticsRepository";

export type {
  KPIs,
  AnalyticsSummary,
  DailyVolume,
  HourlyVolume,
  RatingDistribution,
  ChannelDistribution,
  PromptStats,
};

export type Period = "day" | "week" | "month";
export interface ChartPoint { label: string; count: number; }

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function utcDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  return fetchAnalytics();
}

export function buildChartData(
  period: Period,
  dailyVolume: DailyVolume[],
  hourlyVolume: HourlyVolume[]
): ChartPoint[] {
  if (period === "day") {
    return Array.from({ length: 24 }, (_, h) => {
      const found = hourlyVolume.find((v) => v.hour === h);
      return { label: `${String(h).padStart(2, "0")}h`, count: found?.count ?? 0 };
    });
  }
  if (period === "week") {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - 6 + i);
      const dateStr = utcDateStr(d);
      const found = dailyVolume.find((v) => v.date === dateStr);
      return { label: DAY_NAMES[d.getUTCDay()], count: found?.count ?? 0 };
    });
  }
  return dailyVolume.map((v) => ({ label: v.date.slice(5), count: v.count }));
}
