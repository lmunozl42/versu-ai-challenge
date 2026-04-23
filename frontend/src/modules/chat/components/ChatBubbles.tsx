import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/commons/utils";
import type { Message } from "@/services/conversationsService";

function AIAvatar() {
  return (
    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
      IA
    </div>
  );
}

function UserAvatar({ initial }: { initial: string }) {
  return (
    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
      {initial}
    </div>
  );
}

export function MessageBubble({ msg, userInitial }: { msg: Partial<Message>; userInitial: string }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex items-end gap-2", isUser ? "justify-end" : "justify-start")}>
      {!isUser && <AIAvatar />}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {msg.content}
        {msg.created_at && (
          <span className="block text-xs opacity-60 mt-1">
            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>
      {isUser && <UserAvatar initial={userInitial} />}
    </div>
  );
}

export function ThinkingBubble() {
  return (
    <div className="flex items-end gap-2 justify-start">
      <AIAvatar />
      <div className="rounded-2xl rounded-bl-sm px-4 py-3 bg-muted flex gap-1 items-center">
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex items-end gap-2 justify-start">
      <AIAvatar />
      <div className="max-w-[75%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm bg-muted text-foreground">
        {content}
        <span className="inline-block w-1 h-4 bg-foreground/50 animate-pulse ml-0.5 align-middle" />
      </div>
    </div>
  );
}

export function RatingStars({ onRate }: { onRate: (r: number) => void }) {
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
