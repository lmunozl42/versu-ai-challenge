import client from "./client";

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

export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await client.get<Conversation[]>("/conversations");
  return data;
}

export async function postConversation(channel = "web"): Promise<Conversation> {
  const { data } = await client.post<Conversation>("/conversations", { channel });
  return data;
}

export async function fetchConversation(id: string): Promise<ConversationDetail> {
  const { data } = await client.get<ConversationDetail>(`/conversations/${id}`);
  return data;
}

export async function patchCloseConversation(id: string): Promise<Conversation> {
  const { data } = await client.patch<Conversation>(`/conversations/${id}/close`);
  return data;
}

export async function patchRateConversation(id: string, rating: number): Promise<Conversation> {
  const { data } = await client.patch<Conversation>(`/conversations/${id}/rate`, { rating });
  return data;
}
