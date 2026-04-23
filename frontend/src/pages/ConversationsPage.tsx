import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useConversationsList } from "@/modules/conversations/use_cases/useConversationsList";
import { ConversationsFilters } from "@/modules/conversations/components/ConversationsFilters";
import { ConvRow } from "@/modules/conversations/components/ConvRow";
import { Button } from "@/commons/components/ui/button";
import { Card, CardContent } from "@/commons/components/ui/card";

export default function ConversationsPage() {
  const navigate = useNavigate();
  const data = useConversationsList();

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conversaciones</h1>
          <p className="text-muted-foreground text-sm">
            {data.filtered.length} de {data.conversations.length} conversaciones
          </p>
        </div>
        <Button onClick={() => data.createMut.mutate()} disabled={data.createMut.isPending}>
          <Plus className="h-4 w-4" />
          Nueva conversación
        </Button>
      </div>

      <ConversationsFilters
        statusFilter={data.statusFilter}
        setStatusFilter={data.setStatusFilter}
        minRating={data.minRating}
        setMinRating={data.setMinRating}
        maxRating={data.maxRating}
        setMaxRating={data.setMaxRating}
        dateFrom={data.dateFrom}
        setDateFrom={data.setDateFrom}
        dateTo={data.dateTo}
        setDateTo={data.setDateTo}
        hasActiveFilters={data.hasActiveFilters}
        clearFilters={data.clearFilters}
      />

      <Card>
        <CardContent className="p-0">
          {data.isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : data.filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              No hay conversaciones con estos filtros
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Fecha inicio</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Duración</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Estado</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Canal</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mensajes</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rating</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {data.filtered.map((conv) => (
                    <ConvRow
                      key={conv.id}
                      conv={conv}
                      onView={() => navigate(`/conversations/${conv.id}`)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
