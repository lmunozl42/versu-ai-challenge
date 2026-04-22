import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, MessageSquare } from "lucide-react";
import { listConversations, createConversation, type Conversation } from "@/api/conversations";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const CHANNEL_LABEL: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
};

const CHANNEL_VARIANT: Record<string, "default" | "success" | "secondary"> = {
  web: "default",
  whatsapp: "success",
  instagram: "secondary",
};

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-muted-foreground">Sin calificar</span>;
  return (
    <span className="text-sm">
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

function ConvRow({ conv, onClick }: { conv: Conversation; onClick: () => void }) {
  const date = new Date(conv.created_at).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-0 transition-colors"
    >
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-medium">Conversación</span>
          <Badge variant={CHANNEL_VARIANT[conv.channel] ?? "outline"}>
            {CHANNEL_LABEL[conv.channel]}
          </Badge>
          <Badge variant={conv.status === "open" ? "success" : "secondary"}>
            {conv.status === "open" ? "Abierta" : "Cerrada"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {conv.message_count} mensajes · {date}
        </p>
      </div>
      <div className="flex-shrink-0 text-right">
        <StarRating rating={conv.rating} />
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "open" | "closed">("all");

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    refetchInterval: 15_000,
  });

  const createMut = useMutation({
    mutationFn: () => createConversation("web"),
    onSuccess: (conv) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/conversations/${conv.id}`);
    },
  });

  const filtered = conversations.filter((c) =>
    filter === "all" ? true : c.status === filter
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Conversaciones</h1>
          <p className="text-muted-foreground text-sm">{conversations.length} en total</p>
        </div>
        <Button onClick={() => createMut.mutate()} disabled={createMut.isPending}>
          <Plus className="h-4 w-4" />
          Nueva conversación
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "open", "closed"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "Todas" : f === "open" ? "Abiertas" : "Cerradas"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">No hay conversaciones</p>
            </div>
          ) : (
            filtered.map((conv) => (
              <ConvRow
                key={conv.id}
                conv={conv}
                onClick={() => navigate(`/conversations/${conv.id}`)}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
