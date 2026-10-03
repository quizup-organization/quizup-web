import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "cn";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { PagePattern } from "@/shared/components/page-pattern";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { BottomNav } from "./BottomNav";
import { CommandPalette } from "./CommandPalette";
import {
  LobbyInvitationDialog,
  useNotificationStream,
} from "@/features/notifications";
import { useIsImmersiveRoute } from "../hooks/useIsImmersiveRoute";
import { useSidebarStore } from "../stores/useSidebarStore";
import { useVisualViewportVar } from "@/shared/hooks/useVisualViewportVar";

/**
 * Coquille applicative : sidebar (desktop) + topbar + contenu + nav basse (mobile) + palette ⌘K.
 * Pendant un duel, la sidebar reste visible mais estompée et la topbar est masquée.
 */
export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const sidebarOpen = useSidebarStore((s) => s.open);
  const setSidebarOpen = useSidebarStore((s) => s.setOpen);
  const inMatch = useIsImmersiveRoute();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // L'éditeur d'avatar porte sa propre barre d'actions basse : on masque la nav flottante.
  const hideBottomNav = pathname.startsWith("/settings/avatar");
  useNotificationStream();
  useVisualViewportVar();

  // Restaure la cible mémorisée avant login (ex. lien de salon `/join/:code`).
  useEffect(() => {
    const returnTo = sessionStorage.getItem("quizup.returnTo");
    if (returnTo && returnTo !== pathname) {
      sessionStorage.removeItem("quizup.returnTo");
      navigate(returnTo, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <TooltipProvider>
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        className="h-svh overflow-hidden"
      >
        <AppSidebar inMatch={inMatch} />
        <SidebarInset className="flex min-h-0 flex-col overflow-hidden bg-sidebar dark:bg-background">
          <PagePattern />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            <div
              className={cn(
                "flex-1",
                inMatch ? "overflow-hidden" : "overflow-y-auto",
              )}
            >
              {/* Topbar collante : le contenu défile dessous (verre dépoli). */}
              {!inMatch && (
                <div className="sticky top-0 z-20">
                  <Topbar onOpenPalette={() => setPaletteOpen(true)} />
                </div>
              )}
              {/* Filet par route : un crash de page n'emporte pas la coquille ; le
                  changement de `key` réinitialise l'état d'erreur à la navigation. */}
              <ErrorBoundary key={pathname}>
                <Outlet />
              </ErrorBoundary>
              {/* Dégage la nav flottante : le dernier contenu peut passer au-dessus. */}
              {!inMatch && !hideBottomNav && (
                <div
                  className="h-[calc(var(--bottom-nav-offset)+4.5rem)] md:hidden"
                  aria-hidden="true"
                />
              )}
            </div>
            {!inMatch && !hideBottomNav && <BottomNav />}
          </div>
        </SidebarInset>
      </SidebarProvider>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <LobbyInvitationDialog />
    </TooltipProvider>
  );
}
