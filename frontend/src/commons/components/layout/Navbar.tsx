import { LogOut } from "lucide-react";
import { useAuth } from "@/commons/AuthContext";

export default function Navbar() {
  const { user, setToken } = useAuth();

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-white/10 bg-black text-white px-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">V</span>
          </div>
          <div>
            <p className="font-semibold text-sm leading-none">IA Dashboard</p>
            <p className="text-xs text-white/70 mt-0.5 hidden sm:block">Análisis de conversaciones</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <p className="text-sm font-semibold text-white truncate max-w-[220px]">
          {user?.name}
        </p>
        <button
          onClick={() => setToken(null)}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesion
        </button>
      </div>
    </header>
  );
}
