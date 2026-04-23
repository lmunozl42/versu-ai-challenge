import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/commons/components/ui/card";
import { cn } from "@/commons/utils";

export function Delta({
  current,
  prev,
  invertGood = false,
}: {
  current: number;
  prev: number;
  invertGood?: boolean;
}) {
  if (!prev) return null;
  const pct = ((current - prev) / prev) * 100;
  const isPositive = pct > 0;
  const isGood = invertGood ? !isPositive : isPositive;
  const abs = Math.abs(pct).toFixed(1);

  return (
    <span
      className={cn(
        "flex items-center gap-0.5 text-xs font-medium mt-1",
        isGood ? "text-emerald-600" : "text-red-500"
      )}
    >
      {isGood ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? "+" : "-"}{abs}% vs semana ant.
    </span>
  );
}

export function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  delta,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  delta?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {delta}
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}
