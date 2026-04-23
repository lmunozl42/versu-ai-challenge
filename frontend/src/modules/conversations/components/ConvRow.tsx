import { Eye } from "lucide-react";
import { Button } from "@/commons/components/ui/button";
import { Badge } from "@/commons/components/ui/badge";
import { cn } from "@/commons/utils";
import { formatDate, formatDuration, type Conversation } from "@/services/conversationsService";

const CHANNEL_LABEL: Record<string, string> = {
  web: "Web",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
};

export function ChannelBadge({ channel }: { channel: string }) {
  const classes: Record<string, string> = {
    web: "bg-blue-100 text-blue-800 border-blue-200",
    whatsapp: "bg-green-100 text-green-800 border-green-200",
    instagram: "bg-pink-100 text-pink-800 border-pink-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        classes[channel] ?? "bg-muted text-muted-foreground"
      )}
    >
      {CHANNEL_LABEL[channel] ?? channel}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "open") {
    return (
      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-zinc-900 text-white border-zinc-900">
        Abierta
      </span>
    );
  }
  return <Badge variant="secondary">Cerrada</Badge>;
}

export function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="text-sm leading-none">
      <span className="text-yellow-400">{"★".repeat(rating)}</span>
      <span className="text-muted-foreground/30">{"★".repeat(5 - rating)}</span>
    </span>
  );
}

export function ConvRow({ conv, onView }: { conv: Conversation; onView: () => void }) {
  return (
    <tr className="border-b last:border-0 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
        {conv.id.slice(0, 8)}
      </td>
      <td className="px-4 py-3">{formatDate(conv.created_at)}</td>
      <td className="px-4 py-3 text-muted-foreground">
        {formatDuration(conv.created_at, conv.closed_at)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={conv.status} />
      </td>
      <td className="px-4 py-3">
        <ChannelBadge channel={conv.channel} />
      </td>
      <td className="px-4 py-3 text-muted-foreground">{conv.message_count}</td>
      <td className="px-4 py-3">
        <StarRating rating={conv.rating} />
      </td>
      <td className="px-4 py-3 text-right">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onView}>
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}
