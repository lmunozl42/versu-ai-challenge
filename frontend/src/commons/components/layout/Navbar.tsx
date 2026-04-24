import { useState, useRef, useEffect } from "react";
import { LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/commons/AuthContext";

export default function Navbar() {
  const { user, setToken } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initial = (user?.name ?? user?.email ?? "U")[0].toUpperCase();

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-white/10 bg-black text-white px-5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">V</span>
        </div>
        <div>
          <p className="font-semibold text-sm leading-none">IA Dashboard</p>
          <p className="text-xs text-white/70 mt-0.5 hidden sm:block">Análisis de conversaciones</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
          <p className="text-sm text-white/70 leading-none">{user?.organization?.name}</p>
          <p className="text-xs text-white/40 mt-0.5">{user?.name}</p>
        </div>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="h-9 w-9 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center font-semibold text-sm transition-colors"
          >
            {initial}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/10 bg-zinc-900 shadow-xl z-30 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-white/50 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1">
                <button
                  onClick={() => { setOpen(false); navigate("/profile"); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <UserRound className="h-4 w-4 text-white" />
                  Ver perfil
                </button>
                <button
                  onClick={() => setToken(null)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <LogOut className="h-4 w-4 text-white" />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
