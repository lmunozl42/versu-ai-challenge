import { MessageSquare, ThumbsUp, Clock, CalendarDays } from "lucide-react";
import { useSummaryData } from "@/modules/summary/use_cases/useSummaryData";
import { KPICard, Delta } from "@/modules/summary/components/KPICard";
import { VolumeChart } from "@/modules/summary/components/VolumeChart";

export default function DashboardPage() {
  const { kpis, chartData, hasData, isLoading, period, setPeriod } = useSummaryData();

  if (isLoading || !kpis) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumen</h1>
        <p className="text-muted-foreground text-sm">
          Vista general del rendimiento de las conversaciones con IA
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={MessageSquare}
          label="Conversaciones hoy"
          value={kpis.total_today.toString()}
          sub={`${kpis.total_month} este mes`}
          delta={<Delta current={kpis.total_today} prev={kpis.total_yesterday} />}
        />
        <KPICard
          icon={ThumbsUp}
          label="Satisfacción"
          value={`${kpis.satisfaction_rate}%`}
          sub="Rating ≥ 4 esta semana"
          delta={
            <Delta
              current={kpis.satisfaction_rate}
              prev={kpis.prev_week_satisfaction_rate}
            />
          }
        />
        <KPICard
          icon={Clock}
          label="Tiempo de respuesta"
          value={`${(kpis.avg_response_time_ms / 1000).toFixed(1)}s`}
          sub="Promedio esta semana"
          delta={
            <Delta
              current={kpis.avg_response_time_ms}
              prev={kpis.prev_week_avg_response_time_ms}
              invertGood
            />
          }
        />
        <KPICard
          icon={CalendarDays}
          label="Conversaciones Semana"
          value={kpis.total_week.toString()}
          sub="Últimos 7 días"
        />
      </div>

      <VolumeChart
        chartData={chartData}
        hasData={hasData}
        period={period}
        onPeriodChange={setPeriod}
      />
    </div>
  );
}
