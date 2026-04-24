import { useAuth } from "@/commons/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/commons/components/ui/card";
import { Badge } from "@/commons/components/ui/badge";

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm ${mono ? "font-mono text-xs" : ""} truncate max-w-[60%] text-right`}>
        {value}
      </span>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const initial = (user.name ?? user.email ?? "U")[0].toUpperCase();

  return (
    <div className="p-6 max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground text-sm">
          Información de tu cuenta y rol en la organización
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-blue-500 flex items-center justify-center shrink-0 overflow-hidden">
              <span className="text-white font-bold text-2xl">{initial}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              {user.puesto && (
                <Badge variant="default" className="mt-2">{user.puesto}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos personales</CardTitle>
          <CardDescription>Información asociada a tu cuenta de usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <Row label="Nombre" value={user.name} />
          <Row label="Email" value={user.email} />
          <Row label="Puesto" value={user.puesto ?? "—"} />
          <Row label="Rol" value={user.role} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Organización</CardTitle>
          <CardDescription>Organización a la que perteneces</CardDescription>
        </CardHeader>
        <CardContent>
          <Row label="Nombre" value={user.organization.name} />
        </CardContent>
      </Card>
    </div>
  );
}
