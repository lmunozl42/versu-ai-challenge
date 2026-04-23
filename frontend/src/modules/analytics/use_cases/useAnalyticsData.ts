import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/services/analyticsService";

export function useAnalyticsData() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    refetchInterval: 30_000,
  });

  return {
    ratingDistribution: data?.rating_distribution ?? [],
    channelDistribution: data?.channel_distribution ?? [],
    worstPrompts: data?.worst_prompts ?? [],
    isLoading,
  };
}
