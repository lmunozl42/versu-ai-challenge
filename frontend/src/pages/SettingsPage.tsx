import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [showKey, setShowKey] = useState(false);

  const groqKey = import.meta.env.VITE_GROQ_API_KEY_PREVIEW ?? "gsk_••••••••••••••••";

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-sm">Información de tu organización y API</p>
      </div>

      <div className="space-y-4">
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
      </div>
    </div>
  );
}

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
