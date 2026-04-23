import { useAnalyticsData } from "@/modules/analytics/use_cases/useAnalyticsData";
import {
  ChannelChart,
  RatingChart,
  WorstPromptsTable,
} from "@/modules/analytics/components/AnalyticsCharts";

export default function AnalyticsPage() {
  const { ratingDistribution, channelDistribution, worstPrompts, isLoading } = useAnalyticsData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground text-sm">
          Análisis detallado del rendimiento de las conversaciones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RatingChart data={ratingDistribution} />
        <ChannelChart data={channelDistribution} />
      </div>

      <WorstPromptsTable data={worstPrompts} />
    </div>
  );
}
