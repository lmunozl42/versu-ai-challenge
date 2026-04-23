import {
  fetchPrompts,
  patchSetDefaultPrompt,
  type Prompt,
} from "@/infra/repositories/promptsRepository";

export type { Prompt };

export async function getPrompts(): Promise<Prompt[]> {
  return fetchPrompts();
}

export async function setDefaultPrompt(id: string): Promise<Prompt> {
  return patchSetDefaultPrompt(id);
}
