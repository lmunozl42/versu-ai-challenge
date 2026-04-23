import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/commons/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/commons/components/ui/card";
import type { Period, ChartPoint } from "@/services/analyticsService";

export function VolumeChart({
  chartData,
  hasData,
  period,
  onPeriodChange,
}: {
  chartData: ChartPoint[];
  hasData: boolean;
  period: Period;
  onPeriodChange: (p: Period) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Volumen de conversaciones</CardTitle>
        <div className="flex gap-1">
          {(["day", "week", "month"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              size="sm"
              className="h-7 px-3 text-xs"
              onClick={() => onPeriodChange(p)}
            >
              {p === "day" ? "Hoy" : p === "week" ? "Semana" : "Mes"}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
            Sin conversaciones en este período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11 }}
                interval={period === "month" ? 4 : 0}
              />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
              <Tooltip
                formatter={(v) => [v, "Conversaciones"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Conversaciones"
                stroke="#000000"
                strokeWidth={2}
                dot={{ r: 4, fill: "#000000", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
