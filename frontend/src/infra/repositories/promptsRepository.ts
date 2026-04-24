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

export async function postPrompt(name: string, content: string): Promise<Prompt> {
  const { data } = await client.post<Prompt>("/prompts", { name, content });
  return data;
}

export async function putPrompt(id: string, name: string, content: string): Promise<Prompt> {
  const { data } = await client.put<Prompt>(`/prompts/${id}`, { name, content });
  return data;
}

export async function deletePrompt(id: string): Promise<void> {
  await client.delete(`/prompts/${id}`);
}
