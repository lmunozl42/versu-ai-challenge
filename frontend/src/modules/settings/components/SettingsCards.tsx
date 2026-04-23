import { useState } from "react";
import { Eye, EyeOff, Check, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/commons/components/ui/card";
import { Badge } from "@/commons/components/ui/badge";
import { Button } from "@/commons/components/ui/button";
import type { UserOut } from "@/commons/AuthContext";
import type { Prompt } from "@/services/promptsService";

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

export function UserInfoCard({ user }: { user: UserOut | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Usuario</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row label="Nombre" value={user?.name ?? ""} />
        <Row label="Email" value={user?.email ?? ""} />
        <Row label="ID" value={user?.id ?? ""} mono />
      </CardContent>
    </Card>
  );
}

export function AIApiCard() {
  const [showKey, setShowKey] = useState(false);
  const groqKey = import.meta.env.VITE_GROQ_API_KEY_PREVIEW ?? "gsk_••••••••••••••••";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">API de IA</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Proveedor</span>
          <Badge variant="secondary">Groq</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Modelo</span>
          <span className="text-sm font-mono">llama-3.1-8b-instant</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">API Key</span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono">
              {showKey ? groqKey : "gsk_••••••••••••••••"}
            </span>
            <button
              onClick={() => setShowKey((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PromptCard({
  prompt,
  onSetDefault,
  isPending,
}: {
  prompt: Prompt;
  onSetDefault: () => void;
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
          {!prompt.is_default && (
            <Button variant="outline" size="sm" onClick={onSetDefault} disabled={isPending}>
              Usar por defecto
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">{prompt.content}</p>
      </CardContent>
    </Card>
  );
}
