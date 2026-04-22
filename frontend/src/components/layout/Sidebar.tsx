import { Link, useLocation } from "react-router-dom";
import { BarChart3, MessageSquare, Zap, Settings, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: BarChart3, label: "Dashboard" },
  { to: "/conversations", icon: MessageSquare, label: "Conversaciones" },
  { to: "/prompts", icon: Zap, label: "Prompts" },
  { to: "/settings", icon: Settings, label: "Configuración" },
];

type SidebarProps = {
  isOpen: boolean;
  onToggle: () => void;
};

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { pathname } = useLocation();

  return (
    <aside
      className={cn(
        "sticky top-0 h-full bg-card flex flex-col transition-[width] duration-200 overflow-hidden border-r",
        isOpen ? "w-56" : "w-16"
      )}
    >
      <div className={cn("px-2 py-2 border-b flex", isOpen ? "justify-end" : "justify-center")}>
        <button
          type="button"
          onClick={onToggle}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={isOpen ? "Colapsar menu" : "Expandir menu"}
        >
          <Menu className="h-4 w-4" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isOpen ? "gap-3 justify-start" : "justify-center",
              pathname === to
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={!isOpen ? label : undefined}
          >
            <Icon className="h-4 w-4" />
            {isOpen && <span>{label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
