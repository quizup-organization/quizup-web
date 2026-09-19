import { useLocation, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import {
  Sidebar as SidebarUI,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV } from "./navigation";
import { ProfileMenu } from "./ProfileMenu";
import { useCurrentPlayer } from "../hooks/useCurrentPlayer";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { usePendingChallengesCount } from "@/features/challenges/hooks/useChallenges";

interface AppSidebarProps {
  /** Une partie est en cours : la navigation est estompée sans être retirée du flux. */
  inMatch?: boolean;
}

/** Sidebar shadcn native (Accueil / Sujets / Personnes / Défis). */
export function AppSidebar({ inMatch = false }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { profile, progression, userId } = useCurrentPlayer();
  const logout = useLogout();
  const pendingChallenges = usePendingChallengesCount();

  const player = {
    name: profile?.displayName ?? userId ?? "Joueur",
    level: progression?.level ?? 1,
    xp: progression?.xpTotal ?? 0,
    xpForNextLevel: progression?.xpForNextLevel ?? 500,
  };

  return (
    <SidebarUI collapsible="icon" className={inMatch ? "pointer-events-none opacity-50" : undefined}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => navigate("/")}
              className="data-[state=open]:bg-sidebar-accent"
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background">
                <Zap className="!size-4 fill-current" strokeWidth={0} />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate font-heading font-extrabold">QuizUp</span>
                <span className="truncate text-xs text-muted-foreground">
                  Duels de culture
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.path);
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => navigate(item.path)}
                    >
                      <Icon />
                      <span className="flex-1">{item.label}</span>
                    </SidebarMenuButton>
                    {item.id === "challenges" &&
                      (pendingChallenges.data ?? 0) > 0 && (
                        <SidebarMenuBadge>
                          {pendingChallenges.data}
                        </SidebarMenuBadge>
                      )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ProfileMenu
          player={player}
          collapsed={collapsed}
          onProfile={() => navigate("/profile")}
          onSettings={() => navigate("/settings")}
          onLogout={logout}
          side="top"
          align="start"
        />
      </SidebarFooter>

      <SidebarRail />
    </SidebarUI>
  );
}
