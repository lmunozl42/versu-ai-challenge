import {
  fetchPrompts,
  patchSetDefaultPrompt,
  postPrompt,
  putPrompt,
  deletePrompt,
  type Prompt,
} from "@/infra/repositories/promptsRepository";

export type { Prompt };

export async function getPrompts(): Promise<Prompt[]> {
  return fetchPrompts();
}

export async function setDefaultPrompt(id: string): Promise<Prompt> {
  return patchSetDefaultPrompt(id);
}

export async function createPrompt(name: string, content: string): Promise<Prompt> {
  return postPrompt(name, content);
}

export async function updatePrompt(id: string, name: string, content: string): Promise<Prompt> {
  return putPrompt(id, name, content);
}

export async function removePrompt(id: string): Promise<void> {
  return deletePrompt(id);
}
