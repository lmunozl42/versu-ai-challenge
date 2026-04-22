import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Send, X, Star } from "lucide-react";
import {
  getConversation,
  closeConversation,
  rateConversation,
  type Message,
} from "@/api/conversations";
import { useConversationWS } from "@/hooks/useConversationWS";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function MessageBubble({ msg }: { msg: Partial<Message> }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {msg.content}
        {msg.response_time_ms && (
          <span className="block text-xs opacity-60 mt-1">
            {(msg.response_time_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-muted flex gap-1 items-center">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-muted text-foreground">
        {content}
        <span className="inline-block w-1 h-4 bg-foreground/50 animate-pulse ml-0.5 align-middle" />
      </div>
    </div>
  );
}

function RatingStars({ onRate }: { onRate: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((r) => (
        <button
          key={r}
          onMouseEnter={() => setHover(r)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(r)}
          className="transition-colors"
        >
          <Star
            className={cn(
              "h-6 w-6",
              r <= hover ? "fill-yellow-400 stroke-yellow-400" : "stroke-muted-foreground"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conv, isLoading } = useQuery({
    queryKey: ["conversation", id],
    queryFn: () => getConversation(id!),
    enabled: !!id,
  });

  const [messages, setMessages] = useState<Partial<Message>[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (conv) setMessages(conv.messages);
  }, [conv]);

  const addMessage = (msg: Partial<Message>) => {
    setMessages((prev) => [...prev, msg]);
  };

  const { send, thinking, streaming, streamingContent, connected } = useConversationWS(
    id!,
    addMessage
  );

  const closeMut = useMutation({
    mutationFn: () => closeConversation(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation", id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const rateMut = useMutation({
    mutationFn: (rating: number) => rateConversation(id!, rating),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversation", id] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  function handleSend() {
    const text = input.trim();
    if (!text || thinking || streaming || conv?.status === "closed") return;
    addMessage({ role: "user", content: text, created_at: new Date().toISOString() });
    send(text);
    setInput("");
  }

  if (isLoading || !conv) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const isClosed = conv.status === "closed";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate("/conversations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">Conversación</span>
            <Badge variant={isClosed ? "secondary" : "success"}>
              {isClosed ? "Cerrada" : "Abierta"}
            </Badge>
            {connected && !isClosed && (
              <span className="h-2 w-2 rounded-full bg-green-500" title="Conectado" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {conv.messages.length} mensajes · canal {conv.channel}
          </p>
        </div>
        {!isClosed && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => closeMut.mutate()}
            disabled={closeMut.isPending}
          >
            <X className="h-4 w-4" />
            Cerrar
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !streaming && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Escribe un mensaje para comenzar
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id ?? i} msg={msg} />
        ))}
        {thinking && <ThinkingBubble />}
        {streaming && <StreamingBubble content={streamingContent} />}
        <div ref={bottomRef} />
      </div>

      {/* Rating prompt when closed without rating */}
      {isClosed && !conv.rating && (
        <div className="px-4 py-3 border-t bg-muted/30 flex items-center gap-3">
          <p className="text-sm font-medium">Califica esta conversación:</p>
          <RatingStars onRate={(r) => rateMut.mutate(r)} />
        </div>
      )}
      {isClosed && conv.rating && (
        <div className="px-4 py-3 border-t bg-muted/30 text-sm text-muted-foreground">
          Calificada con {conv.rating}/5 ★
        </div>
      )}

      {/* Input */}
      {!isClosed && (
        <div className="px-4 py-3 border-t bg-card flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={streaming}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || thinking || streaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
