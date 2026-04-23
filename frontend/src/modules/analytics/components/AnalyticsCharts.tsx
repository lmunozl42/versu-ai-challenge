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
import { Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/commons/components/ui/card";
import type {
  RatingDistribution,
  ChannelDistribution,
  PromptStats,
} from "@/services/analyticsService";

const CHANNEL_COLORS: Record<string, string> = {
  web: "#3b82f6",
  whatsapp: "#22c55e",
  instagram: "#ec4899",
};

export function ChannelChart({ data }: { data: ChannelDistribution[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversaciones por Canal</CardTitle>
        <CardDescription>Porcentaje de conversaciones por canal de origen</CardDescription>
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
        <CardTitle>Distribución de Ratings</CardTitle>
        <CardDescription>Cantidad de conversaciones por rating recibido</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis dataKey="rating" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}⭐`} />
            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
            <Tooltip formatter={(v) => [`${v}`, "Conversaciones"]} labelFormatter={(v) => `${v}⭐`} />
            <Bar dataKey="count" name="Conversaciones" fill="#18181b" radius={[4, 4, 0, 0]} />
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
        <CardTitle>Top 5 Prompts con Peor Rating</CardTitle>
        <CardDescription>Prompts que generaron los ratings más bajos en promedio</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Sin datos suficientes — se necesitan conversaciones cerradas con rating
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Ranking</th>
                  <th className="text-left p-4 font-medium">Prompt</th>
                  <th className="text-left p-4 font-medium">Rating Promedio</th>
                  <th className="text-left p-4 font-medium">Conversaciones</th>
                  <th className="text-left p-4 font-medium">
                    <div className="flex items-center gap-1.5">
                      Impacto
                      <div className="relative group">
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-10 w-56 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
                          <p className="font-semibold mb-1">Cálculo del impacto</p>
                          <p className="text-muted-foreground">(5 − rating promedio) × conversaciones</p>
                          <p className="text-muted-foreground mt-1">Cuanto mayor, más daño acumulado genera el prompt.</p>
                        </div>
                      </div>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((p, i) => {
                  const impact = (5 - p.avg_rating) * p.conversation_count;
                  const impactLabel = impact >= 60
                    ? { text: "Alto impacto negativo", cls: "bg-red-100 text-red-800" }
                    : impact >= 30
                    ? { text: "Impacto moderado", cls: "bg-orange-100 text-orange-800" }
                    : { text: "Bajo impacto", cls: "bg-blue-100 text-blue-800" };
                  const filledStars = Math.round(p.avg_rating);
                  return (
                    <tr key={i} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 font-bold text-sm">
                          {i + 1}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{p.prompt_name}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.avg_rating.toFixed(1)}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }, (_, s) => (
                              <span key={s} className={`text-sm ${s < filledStars ? "text-yellow-500" : "text-gray-300"}`}>★</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">{p.conversation_count}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${impactLabel.cls}`}>
                          {impactLabel.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
