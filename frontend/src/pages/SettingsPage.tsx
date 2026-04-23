import { useSettingsData } from "@/modules/settings/use_cases/useSettingsData";
import {
  OrgInfoCard,
  AIApiCard,
  PromptCard,
} from "@/modules/settings/components/SettingsCards";

export default function SettingsPage() {
  const { user, prompts, promptsLoading, setDefaultMut } = useSettingsData();

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm">
          Organización y personalidades del agente de IA
        </p>
      </div>

      <OrgInfoCard user={user} />
      <AIApiCard />

      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold">Personalidades del agente</h2>
          <p className="text-muted-foreground text-sm">
            El prompt predeterminado se usa como system message en cada conversación.
          </p>
        </div>

        {promptsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid gap-3">
            {prompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onSetDefault={() => setDefaultMut.mutate(prompt.id)}
                isPending={setDefaultMut.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
