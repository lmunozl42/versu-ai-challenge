import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/commons/components/ui/card";
import type {
  RatingDistribution,
  ChannelDistribution,
  PromptStats,
} from "@/services/analyticsService";

const CHANNEL_COLORS: Record<string, string> = {
  web: "#6366f1",
  whatsapp: "#22c55e",
  instagram: "#ec4899",
};

export function ChannelChart({ data }: { data: ChannelDistribution[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Distribución por canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="channel"
              cx="50%"
              cy="50%"
              outerRadius={85}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function RatingChart({ data }: { data: RatingDistribution[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Distribución de ratings</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="rating" tick={{ fontSize: 11 }} tickFormatter={(v) => `${"★".repeat(v)}`} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [`${v}`, "Conversaciones"]} />
            <Bar dataKey="count" name="Conversaciones" fill="#6366f1" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function WorstPromptsTable({ data }: { data: PromptStats[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          Top 5 prompts con peor rating promedio
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Sin datos suficientes — se necesitan conversaciones cerradas con rating
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left pb-2 font-medium">#</th>
                  <th className="text-left pb-2 font-medium">Prompt</th>
                  <th className="text-right pb-2 font-medium">Conversaciones</th>
                  <th className="text-right pb-2 font-medium">Rating promedio</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-3 font-medium">{p.prompt_name}</td>
                    <td className="py-3 text-right text-muted-foreground">{p.conversation_count}</td>
                    <td className="py-3 text-right">
                      <span className="font-bold text-destructive">{p.avg_rating.toFixed(1)}</span>
                      <span className="text-muted-foreground"> /5</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
