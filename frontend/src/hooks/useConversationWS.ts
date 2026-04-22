import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Message } from "@/api/conversations";

interface WSMessage {
  type: "token" | "done" | "new_conversation";
  content?: string;
  message_id?: string;
}

interface UseConversationWSReturn {
  send: (content: string) => void;
  thinking: boolean;
  streaming: boolean;
  streamingContent: string;
  connected: boolean;
}

export function useConversationWS(
  conversationId: string,
  onNewMessage: (msg: Partial<Message>) => void
): UseConversationWSReturn {
  const { token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [thinking, setThinking] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [connected, setConnected] = useState(false);
  const bufferRef = useRef("");

  useEffect(() => {
    if (!token || !conversationId) return;

    const apiBaseUrl =
      import.meta.env.VITE_API_URL ??
      `${window.location.protocol}//${window.location.hostname}:8000`;
    const wsBaseUrl = apiBaseUrl.replace(/^http/, "ws").replace(/\/$/, "");
    const url = `${wsBaseUrl}/ws/conversations/${conversationId}?token=${token}`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e: MessageEvent) => {
      const msg: WSMessage = JSON.parse(e.data as string);

      if (msg.type === "token") {
        bufferRef.current += msg.content ?? "";
        setStreamingContent(bufferRef.current);
        setThinking(false);
        setStreaming(true);
      } else if (msg.type === "done") {
        const full = bufferRef.current;
        bufferRef.current = "";
        setStreamingContent("");
        setThinking(false);
        setStreaming(false);
        onNewMessage({
          id: msg.message_id,
          role: "ai",
          content: full,
          created_at: new Date().toISOString(),
        });
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [conversationId, token]);

  const send = useCallback((content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      setThinking(true);
      wsRef.current.send(JSON.stringify({ type: "message", content }));
    }
  }, []);

  return { send, thinking, streaming, streamingContent, connected };
}
