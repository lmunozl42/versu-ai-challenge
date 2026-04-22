import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Zap } from "lucide-react";
import { listPrompts, setDefaultPrompt } from "@/api/prompts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PromptsPage() {
  const qc = useQueryClient();

  const { data: prompts = [], isLoading } = useQuery({
    queryKey: ["prompts"],
    queryFn: listPrompts,
  });

  const setDefaultMut = useMutation({
    mutationFn: setDefaultPrompt,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["prompts"] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Prompts</h1>
        <p className="text-muted-foreground text-sm">
          Personalidades del agente de IA. Solo uno puede ser el predeterminado.
        </p>
      </div>

      <div className="grid gap-4">
        {prompts.map((prompt) => (
          <Card
            key={prompt.id}
            className={prompt.is_default ? "border-primary ring-1 ring-primary" : ""}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">{prompt.name}</CardTitle>
                  {prompt.is_default && (
                    <Badge variant="default" className="text-xs">
                      <Check className="h-3 w-3 mr-1" />
                      Predeterminado
                    </Badge>
                  )}
                </div>
                {!prompt.is_default && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDefaultMut.mutate(prompt.id)}
                    disabled={setDefaultMut.isPending}
                  >
                    Usar por defecto
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{prompt.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
