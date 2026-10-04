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
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { NAV, isNavItemActive } from "./navigation";
import { ProfileMenu } from "./ProfileMenu";
import { useMe } from "../hooks/useMe";
import { useLogout } from "@/features/auth";
import { useUnreadNotificationsCount } from "@/features/notifications";

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
  const { data: me, userId } = useMe();
  const logout = useLogout();
  const unread = useUnreadNotificationsCount();
  const unreadCount = unread.data?.count ?? 0;

  const player = {
    name: me?.pseudonym ?? userId ?? "Joueur",
    level: me?.progression.level ?? 1,
    xp: me?.progression.xpTotal ?? 0,
    xpForNextLevel: me?.progression.xpForNextLevel ?? 500,
    userId: userId ?? undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
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
                const isActive = isNavItemActive(item, pathname);
                const badge =
                  item.id === "notifications" && unreadCount > 0
                    ? unreadCount
                    : 0;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => navigate(item.path)}
                    >
                      <span className="relative shrink-0">
                        <Icon />
                        {badge > 0 && (
                          <span className="absolute -top-1 -right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-heading text-[10px] font-bold text-primary-foreground">
                            {badge > 9 ? "9+" : badge}
                          </span>
                        )}
                      </span>
                      <span className="flex-1">{item.label}</span>
                    </SidebarMenuButton>
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
