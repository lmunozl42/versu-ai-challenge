import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAnalytics, buildChartData, type Period } from "@/services/analyticsService";

export function useSummaryData() {
  const [period, setPeriod] = useState<Period>("week");

  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    refetchInterval: 30_000,
  });

  const chartData = data
    ? buildChartData(period, data.daily_volume, data.hourly_volume ?? [])
    : [];
  const hasData = chartData.some((d) => d.count > 0);

  return { kpis: data?.kpis, chartData, hasData, isLoading, period, setPeriod };
}
