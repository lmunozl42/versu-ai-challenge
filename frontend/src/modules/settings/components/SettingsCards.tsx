import { useState, useEffect } from "react";
import { Check, Zap, Pencil, Trash2, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/commons/components/ui/card";
import { Badge } from "@/commons/components/ui/badge";
import { Button } from "@/commons/components/ui/button";
import { Input } from "@/commons/components/ui/input";
import { Label } from "@/commons/components/ui/label";
import type { UserOut } from "@/commons/AuthContext";
import type { Prompt } from "@/services/promptsService";
import type { PromptFormState } from "../use_cases/useSettingsData";

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? "font-mono text-xs" : ""} truncate max-w-[60%] text-right`}>
        {value}
      </span>
    </div>
  );
}

export function OrgInfoCard({ user }: { user: UserOut | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Organización</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Nombre" value={user?.organization.name ?? ""} />
        <Row label="Slug" value={user?.organization.slug ?? ""} />
        <Row label="ID" value={user?.org_id ?? ""} mono />
      </CardContent>
    </Card>
  );
}

export function AIApiCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Configuración de API</CardTitle>
          <Badge variant="secondary">Solo lectura</Badge>
        </div>
        <CardDescription>Conexión al proveedor de IA configurado en el servidor</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <Input disabled value="Groq" className="bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label>Modelo</Label>
            <Input disabled value="llama-3.1-8b-instant" className="bg-muted font-mono text-sm" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>API Key</Label>
          <Input disabled value="gsk_••••••••••••••••••••••••••••••••" className="bg-muted font-mono text-sm" />
        </div>
      </CardContent>
    </Card>
  );
}

export function PromptCard({
  prompt,
  onSetDefault,
  onEdit,
  onDelete,
  isPending,
}: {
  prompt: Prompt;
  onSetDefault: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  return (
    <Card className={prompt.is_default ? "border-primary ring-1 ring-primary" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm font-medium">{prompt.name}</CardTitle>
            {prompt.is_default && (
              <Badge variant="default" className="text-xs">
                <Check className="h-3 w-3 mr-1" />
                Predeterminado
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!prompt.is_default && (
              <Button variant="outline" size="sm" onClick={onSetDefault} disabled={isPending}>
                Usar por defecto
              </Button>
            )}
            <button
              onClick={onEdit}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            {!prompt.is_default && (
              <button
                onClick={onDelete}
                className="p-1.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{prompt.content}</p>
        <p className="text-xs text-muted-foreground/60 mt-3">
          Creado el {new Date(prompt.created_at).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </CardContent>
    </Card>
  );
}

export function PromptFormDialog({
  open,
  editing,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  editing: Prompt | null;
  onClose: () => void;
  onSubmit: (values: PromptFormState) => void;
  isSubmitting: boolean;
}) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (open) {
      setName(editing?.name ?? "");
      setContent(editing?.content ?? "");
    }
  }, [open, editing]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    onSubmit({ name: name.trim(), content: content.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-background border rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">
            {editing ? "Editar personalidad" : "Nueva personalidad"}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="prompt-name">Nombre</Label>
            <Input
              id="prompt-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Agente formal"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prompt-content">System prompt</Label>
            <textarea
              id="prompt-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Eres un asistente..."
              required
              rows={5}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : editing ? "Guardar cambios" : "Crear"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
