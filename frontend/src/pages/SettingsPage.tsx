import { Plus } from "lucide-react";
import { useSettingsData } from "@/modules/settings/use_cases/useSettingsData";
import {
  AIApiCard,
  PromptCard,
  PromptFormDialog,
} from "@/modules/settings/components/SettingsCards";
import { Button } from "@/commons/components/ui/button";

export default function SettingsPage() {
  const {
    prompts, promptsLoading,
    setDefaultMut, deleteMut,
    formOpen, editing,
    openCreate, openEdit, closeForm, submitForm, isSubmitting,
  } = useSettingsData();

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm">
          Organización y personalidades del agente de IA
        </p>
      </div>

      <AIApiCard />

      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold">Personalidades del agente</h2>
            <p className="text-muted-foreground text-sm">
              El prompt predeterminado se usa como system message en cada conversación.
            </p>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva
          </Button>
        </div>

        {promptsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSetDefault={() => setDefaultMut.mutate(prompt.id)}
                onEdit={() => openEdit(prompt)}
                onDelete={() => deleteMut.mutate(prompt.id)}
                isPending={setDefaultMut.isPending || deleteMut.isPending}
              />
            ))}
          </div>
        )}
      </div>

      <PromptFormDialog
        open={formOpen}
        editing={editing}
        onClose={closeForm}
        onSubmit={submitForm}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
