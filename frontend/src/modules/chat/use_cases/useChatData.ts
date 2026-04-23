import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/commons/AuthContext";
import {
  getConversation,
  closeConversation,
  rateConversation,
  isConversationClosed,
  type Message,
} from "@/services/conversationsService";
import { useConversationWS } from "@/services/useConversationWS";

export function useChatData() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const userInitial = (user?.name ?? user?.email ?? "U")[0].toUpperCase();

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

  const ws = useConversationWS(id!, addMessage);

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

  const isClosed = isConversationClosed(conv);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ws.streamingContent]);

  function handleSend() {
    const text = input.trim();
    if (!text || ws.thinking || ws.streaming || isClosed) return;
    addMessage({ role: "user", content: text, created_at: new Date().toISOString() });
    ws.send(text);
    setInput("");
  }

  return {
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
  };
}
