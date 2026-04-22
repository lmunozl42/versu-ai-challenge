import { useQuery } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { MessageSquare, ThumbsUp, Clock, TrendingUp } from "lucide-react";
import { getAnalytics } from "@/api/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CHANNEL_COLORS: Record<string, string> = {
  web: "#6366f1",
  whatsapp: "#22c55e",
  instagram: "#ec4899",
};

function KPICard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: getAnalytics,
    refetchInterval: 30_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const { kpis, daily_volume, rating_distribution, channel_distribution, worst_prompts } = data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Resumen de conversaciones de IA</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={MessageSquare}
          label="Chats hoy"
          value={kpis.total_today.toString()}
          sub={`${kpis.total_week} esta semana`}
        />
        <KPICard
          icon={TrendingUp}
          label="Total mes"
          value={kpis.total_month.toString()}
          sub="Últimos 30 días"
        />
        <KPICard
          icon={ThumbsUp}
          label="Satisfacción"
          value={`${kpis.satisfaction_rate}%`}
          sub="Rating ≥ 4"
        />
        <KPICard
          icon={Clock}
          label="Tiempo resp. IA"
          value={`${(kpis.avg_response_time_ms / 1000).toFixed(1)}s`}
          sub="Promedio"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Volume trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Volumen diario (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={daily_volume}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Conversaciones"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Channel pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Canal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={channel_distribution}
                  dataKey="count"
                  nameKey="channel"
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  label={({ name, percent }: { name?: string; percent?: number }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {channel_distribution.map((entry) => (
                    <Cell
                      key={entry.channel}
                      fill={CHANNEL_COLORS[entry.channel] ?? "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Rating distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Distribución de ratings</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={rating_distribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(v) => [`${v}`, "Conversaciones"]}
                />
                <Bar dataKey="count" name="Conversaciones" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Worst prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 5 prompts peor calificados</CardTitle>
          </CardHeader>
          <CardContent>
            {worst_prompts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
            ) : (
              <div className="space-y-3">
                {worst_prompts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.prompt_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.conversation_count} conv.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-destructive">
                        {p.avg_rating.toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground"> /5</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
