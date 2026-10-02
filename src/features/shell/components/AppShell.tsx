import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "cn";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";
import { CommandPalette } from "./CommandPalette";
import { useRealtimeNotifications } from "../hooks/useRealtimeNotifications";
import { useIsImmersiveRoute } from "../hooks/useIsImmersiveRoute";
import { useSidebarStore } from "../stores/useSidebarStore";

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
  useRealtimeNotifications();

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
        <SidebarInset className="flex min-h-0 flex-col overflow-hidden">
          {!inMatch && <Topbar onOpenPalette={() => setPaletteOpen(true)} />}
          <div
            className={cn(
              "flex-1 bg-sidebar dark:bg-background",
              inMatch ? "overflow-hidden" : "overflow-y-auto",
            )}
          >
            {/* Filet par route : un crash de page n'emporte pas la coquille ; le
                changement de `key` réinitialise l'état d'erreur à la navigation. */}
            <ErrorBoundary key={pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
          {!inMatch && <MobileNav />}
        </SidebarInset>
      </SidebarProvider>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </TooltipProvider>
  );
}
