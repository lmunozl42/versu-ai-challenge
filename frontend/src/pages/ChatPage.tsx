import { ArrowLeft, Send, X } from "lucide-react";
import { useChatData } from "@/modules/chat/use_cases/useChatData";
import {
  MessageBubble,
  ThinkingBubble,
  StreamingBubble,
  RatingStars,
} from "@/modules/chat/components/ChatBubbles";
import { Button } from "@/commons/components/ui/button";
import { Input } from "@/commons/components/ui/input";
import { Badge } from "@/commons/components/ui/badge";

export default function ChatPage() {
  const {
    conv,
    isLoading,
    messages,
    input,
    setInput,
    handleSend,
    closeMut,
    rateMut,
    ws,
    bottomRef,
    isClosed,
    userInitial,
    navigate,
  } = useChatData();

  if (isLoading || !conv) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
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
            {ws.connected && !isClosed && (
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

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && !ws.streaming && (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            Escribe un mensaje para comenzar
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={msg.id ?? i} msg={msg} userInitial={userInitial} />
        ))}
        {ws.thinking && <ThinkingBubble />}
        {ws.streaming && <StreamingBubble content={ws.streamingContent} />}
        <div ref={bottomRef} />
      </div>

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

      {!isClosed && (
        <div className="px-4 py-3 border-t bg-card flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            disabled={ws.streaming}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || ws.thinking || ws.streaming}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
