import api from "./client";

export interface Conversation {
  id: string;
  org_id: string;
  status: "open" | "closed";
  channel: "web" | "whatsapp" | "instagram";
  rating: number | null;
  created_at: string;
  closed_at: string | null;
  message_count: number;
}

export interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  response_time_ms: number | null;
  created_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export async function listConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>("/conversations");
  return data;
}

export async function createConversation(channel = "web"): Promise<Conversation> {
  const { data } = await api.post<Conversation>("/conversations", { channel });
  return data;
}

export async function getConversation(id: string): Promise<ConversationDetail> {
  const { data } = await api.get<ConversationDetail>(`/conversations/${id}`);
  return data;
}

export async function closeConversation(id: string): Promise<Conversation> {
  const { data } = await api.patch<Conversation>(`/conversations/${id}/close`);
  return data;
}

export async function rateConversation(id: string, rating: number): Promise<Conversation> {
  const { data } = await api.patch<Conversation>(`/conversations/${id}/rate`, { rating });
  return data;
}
