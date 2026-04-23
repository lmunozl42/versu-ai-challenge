import { ArrowLeft, Send, X } from "lucide-react";
import Swal from "sweetalert2";
import { useChatData } from "@/modules/chat/use_cases/useChatData";
import {
  MessageBubble,
  ThinkingBubble,
  StreamingBubble,
} from "@/modules/chat/components/ChatBubbles";
import {
  ChannelBadge,
  StatusBadge,
  StarRating,
} from "@/modules/conversations/components/ConvRow";
import { Button } from "@/commons/components/ui/button";
import { Input } from "@/commons/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/commons/components/ui/card";
import { formatDuration } from "@/services/conversationsService";

const swalTheme = {
  buttonsStyling: false,
  customClass: {
    popup: "!rounded-xl !border !border-zinc-200 !shadow-xl !bg-white !font-[system-ui]",
    title: "!text-zinc-900 !text-lg !font-semibold",
    htmlContainer: "!text-zinc-500 !text-sm",
    confirmButton:
      "!bg-zinc-900 !text-white !px-4 !py-2 !rounded-lg !text-sm !font-medium hover:!bg-zinc-700 !transition-colors",
    cancelButton:
      "!bg-white !text-zinc-800 !px-4 !py-2 !rounded-lg !text-sm !font-medium !border !border-zinc-200 hover:!bg-zinc-50 !transition-colors",
    actions: "!gap-2",
    validationMessage: "!text-xs !rounded-lg",
  },
} as const;

export default function ChatPage() {
  const {
    conv,
    isLoading,
    isError,
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

  if (isLoading || isError || !conv) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  async function handleClose() {
    const confirm = await Swal.fire({
      ...swalTheme,
      title: "¿Cerrar conversación?",
      text: "Una vez cerrada no podrás enviar más mensajes.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, cerrar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    await closeMut.mutateAsync();

    await new Promise((r) => setTimeout(r, 500));

    let selectedRating = 0;
    const { isConfirmed, value } = await Swal.fire({
      ...swalTheme,
      title: "¿Cómo estuvo la conversación?",
      html: `
        <p style="color:#71717a;font-size:0.85rem;margin-bottom:14px">Ayúdanos calificando la atención recibida</p>
        <div id="swal-stars" style="display:flex;justify-content:center;gap:10px;font-size:3rem;cursor:pointer;line-height:1;">
          ${[1, 2, 3, 4, 5].map((i) => `<span data-val="${i}" style="color:#e4e4e7;transition:color .12s">★</span>`).join("")}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Enviar calificación",
      cancelButtonText: "Omitir",
      reverseButtons: true,
      didOpen: () => {
        const stars = [
          ...document.querySelectorAll<HTMLElement>("#swal-stars [data-val]"),
        ];
        const highlight = (n: number) =>
          stars.forEach((s, i) => {
            s.style.color = i < n ? "#fbbf24" : "#e4e4e7";
          });
        stars.forEach((s) => {
          const val = Number(s.dataset.val);
          s.addEventListener("mouseenter", () => highlight(val));
          s.addEventListener("mouseleave", () => highlight(selectedRating));
          s.addEventListener("click", () => {
            selectedRating = val;
            highlight(val);
          });
        });
      },
      preConfirm: () => {
        if (!selectedRating) {
          Swal.showValidationMessage("Selecciona al menos una estrella");
          return false;
        }
        return selectedRating;
      },
    });

    if (isConfirmed && value) rateMut.mutate(value as number);
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
            <span className="font-mono text-xs text-muted-foreground">{conv.id.slice(0, 8)}</span>
          </div>
        </div>
      </div>

      <Card className="mx-4 mt-4 shrink-0">
        <CardHeader className="px-5 pt-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Información de la Conversación</CardTitle>
          {!isClosed && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={closeMut.isPending}
            >
              <X className="h-4 w-4" />
              Cerrar conversación
            </Button>
          )}
        </CardHeader>
        <CardContent className="px-5 pb-4 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Canal</span>
            <ChannelBadge channel={conv.channel} />
          </div>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Estado</span>
            <StatusBadge status={conv.status} />
            {ws.connected && !isClosed && (
              <span className="h-2 w-2 rounded-full bg-green-500" title="Conectado" />
            )}
          </div>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Rating</span>
            <StarRating rating={conv.rating} />
          </div>
          <div className="w-px h-4 bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Mensajes</span>
            <span className="font-medium">{conv.messages.length}</span>
          </div>
          {isClosed && (
            <>
              <div className="w-px h-4 bg-border hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Duración</span>
                <span className="font-medium">{formatDuration(conv.created_at, conv.closed_at)}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="mx-4 my-3 flex-1 flex flex-col overflow-hidden">
        <CardHeader className="px-5 pt-4 pb-2 shrink-0">
          <CardTitle className="text-sm font-semibold">Historial de mensajes</CardTitle>
        </CardHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && !ws.streaming && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
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

        {isClosed && conv.rating && (
          <div className="px-4 py-3 border-t bg-muted/30 text-sm text-muted-foreground">
            Calificada con {conv.rating}/5 ★
          </div>
        )}

        {!isClosed && (
          <div className="px-4 py-3 border-t flex gap-2">
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
      </Card>
    </div>
  );
}
