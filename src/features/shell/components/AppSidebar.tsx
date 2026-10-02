import { Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { Tooltip } from "@heroui/react";
import { cn } from "cn";
import { NAV } from "./navigation";
import { ProfileMenu } from "./ProfileMenu";
import { useMe } from "../hooks/useMe";
import { useLogout } from "@/features/auth";
import { usePendingCount } from "@/features/challenges";
import { useSidebarStore } from "../stores/useSidebarStore";

interface AppSidebarProps {
  /** Une partie est en cours : la navigation est estompée sans être retirée du flux. */
  inMatch?: boolean;
}

/** Sidebar de navigation (Accueil / Sujets / Personnes / Défis), repliable en rail d'icônes. */
export function AppSidebar({ inMatch = false }: AppSidebarProps) {
  const open = useSidebarStore((s) => s.open);
  const collapsed = !open;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: me, userId } = useMe();
  const logout = useLogout();
  const pendingChallenges = usePendingCount();

  const player = {
    name: me?.pseudonym ?? userId ?? "Joueur",
    level: me?.progression.level ?? 1,
    xp: me?.progression.xpTotal ?? 0,
    xpForNextLevel: me?.progression.xpForNextLevel ?? 500,
    userId: userId ?? undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  };

  const pending = pendingChallenges.data ?? 0;

  return (
    <aside
      className={cn(
        "hidden h-svh shrink-0 flex-col border-r border-separator bg-surface transition-[width] duration-200 md:flex",
        collapsed ? "w-16" : "w-64",
        inMatch && "pointer-events-none opacity-50",
      )}
    >
      <div className="flex h-16 shrink-0 items-center border-b border-separator px-2">
        <button
          type="button"
          onClick={() => navigate("/")}
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-xl text-left hover:bg-default",
            collapsed ? "justify-center p-1.5" : "w-full p-2",
          )}
        >
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background">
            <Zap className="size-4 fill-current" strokeWidth={0} />
          </div>
          {!collapsed && (
            <div className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate font-heading font-extrabold">QuizUp</span>
              <span className="truncate text-xs text-muted">Duels de culture</span>
            </div>
          )}
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {NAV.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
          const showBadge = item.id === "challenges" && pending > 0;

          const button = (
            <button
              type="button"
              onClick={() => navigate(item.path)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex h-10 w-full items-center gap-3 rounded-xl text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "px-3",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-foreground/80 hover:bg-default",
              )}
            >
              <Icon className="size-[18px] shrink-0" />
              {!collapsed && <span className="flex-1 truncate text-left">{item.label}</span>}
              {showBadge && !collapsed && (
                <span className="grid min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-semibold text-danger-foreground">
                  {pending}
                </span>
              )}
              {showBadge && collapsed && (
                <span
                  className="absolute top-2 right-2 size-2 rounded-full bg-danger"
                  aria-hidden
                />
              )}
            </button>
          );

          return collapsed ? (
            <Tooltip key={item.id} delay={200}>
              <Tooltip.Trigger>{button}</Tooltip.Trigger>
              <Tooltip.Content placement="right">
                {item.label}
                {showBadge ? ` (${pending})` : ""}
              </Tooltip.Content>
            </Tooltip>
          ) : (
            <Fragment key={item.id}>{button}</Fragment>
          );
        })}
      </nav>

      <div className="shrink-0 border-t border-separator p-2">
        <ProfileMenu
          player={player}
          collapsed={collapsed}
          onProfile={() => navigate("/profile")}
          onSettings={() => navigate("/settings")}
          onLogout={logout}
          side="top"
          align="start"
        />
      </div>
    </aside>
  );
}
