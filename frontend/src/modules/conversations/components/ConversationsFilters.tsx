import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/commons/components/ui/card";
import { Input } from "@/commons/components/ui/input";
import type { StatusFilter } from "@/services/conversationsService";

const selectClass =
  "h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring";

export function ConversationsFilters({
  statusFilter,
  setStatusFilter,
  minRating,
  setMinRating,
  maxRating,
  setMaxRating,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  hasActiveFilters,
  clearFilters,
}: {
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  minRating: number;
  setMinRating: (v: number) => void;
  maxRating: number;
  setMaxRating: (v: number) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Filtros</span>
          </div>
          {hasActiveFilters && (
            <button
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Estado</label>
            <select
              className={selectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            >
              <option value="all">Todos</option>
              <option value="open">Abierta</option>
              <option value="closed">Cerrada</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Rating mínimo</label>
            <select
              className={selectClass}
              value={minRating}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMinRating(val);
                if (val > maxRating) setMaxRating(val);
              }}
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} {r === 1 ? "estrella" : "estrellas"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Rating máximo</label>
            <select
              className={selectClass}
              value={maxRating}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxRating(val);
                if (val < minRating) setMinRating(val);
              }}
            >
              {[1, 2, 3, 4, 5].map((r) => (
                <option key={r} value={r}>
                  {r} {r === 1 ? "estrella" : "estrellas"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <Input
              type="date"
              className="h-9 text-sm"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <Input
              type="date"
              className="h-9 text-sm"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
