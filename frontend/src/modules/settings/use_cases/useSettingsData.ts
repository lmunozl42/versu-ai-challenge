import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPrompts, setDefaultPrompt, createPrompt, updatePrompt, removePrompt } from "@/services/promptsService";
import type { Prompt } from "@/services/promptsService";

export type PromptFormState = { name: string; content: string };

export function useSettingsData() {
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Prompt | null>(null);

  const { data: prompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: getPrompts,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["prompts"] });

  const setDefaultMut = useMutation({ mutationFn: setDefaultPrompt, onSuccess: invalidate });

  const createMut = useMutation({
    mutationFn: ({ name, content }: PromptFormState) => createPrompt(name, content),
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ name, content }: PromptFormState) => updatePrompt(editing!.id, name, content),
    onSuccess: () => { invalidate(); setFormOpen(false); setEditing(null); },
  });

  const deleteMut = useMutation({ mutationFn: removePrompt, onSuccess: invalidate });

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(p: Prompt) { setEditing(p); setFormOpen(true); }
  function closeForm() { setFormOpen(false); setEditing(null); }

  function submitForm(values: PromptFormState) {
    if (editing) updateMut.mutate(values);
    else createMut.mutate(values);
  }

  return {
    prompts,
    promptsLoading,
    setDefaultMut,
    deleteMut,
    formOpen,
    editing,
    openCreate,
    openEdit,
    closeForm,
    submitForm,
    isSubmitting: createMut.isPending || updateMut.isPending,
  };
}
