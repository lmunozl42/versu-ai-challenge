import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPrompts, setDefaultPrompt } from "@/services/promptsService";
import { useAuth } from "@/commons/AuthContext";

export function useSettingsData() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: prompts = [], isLoading: promptsLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: getPrompts,
  });

  const setDefaultMut = useMutation({
    mutationFn: setDefaultPrompt,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompts"] }),
  });

  return { user, prompts, promptsLoading, setDefaultMut };
}
