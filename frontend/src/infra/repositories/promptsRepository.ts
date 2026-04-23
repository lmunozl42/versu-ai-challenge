import client from "./client";

export interface Prompt {
  id: string;
  name: string;
  content: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export async function fetchPrompts(): Promise<Prompt[]> {
  const { data } = await client.get<Prompt[]>("/prompts");
  return data;
}

export async function patchSetDefaultPrompt(id: string): Promise<Prompt> {
  const { data } = await client.patch<Prompt>(`/prompts/${id}/set-default`);
  return data;
}
