import api from "./client";

export interface Prompt {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export async function listPrompts(): Promise<Prompt[]> {
  const { data } = await api.get<Prompt[]>("/prompts");
  return data;
}

export async function setDefaultPrompt(id: string): Promise<Prompt> {
  const { data } = await api.patch<Prompt>(`/prompts/${id}/set-default`);
  return data;
}
