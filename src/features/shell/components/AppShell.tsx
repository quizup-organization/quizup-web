import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { MotionConfig, motion } from "framer-motion";
import { cn } from "cn";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { PagePattern } from "@/shared/components/page-pattern";
import { ScrollContainerProvider } from "@/shared/components/scroll-container-provider";
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
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { useScrollHeader } from "@/shared/hooks/useScrollHeader";
import { useScrollRestoration } from "@/shared/hooks/useScrollRestoration";

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
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  // L'éditeur d'avatar porte ses propres bandeaux collants : nav basse masquée partout,
  // topbar masquée en mobile (le bandeau preview + les onglets la remplacent).
  const avatarEditor = pathname.startsWith("/settings/avatar");
  const hideBottomNav = avatarEditor;
  const hideMobileTopbar = avatarEditor && isMobile;
  const { hidden: scrollHeaderHidden, reset: resetScrollHeader } =
    useScrollHeader(scrollRef);
  useScrollRestoration({ containerRef: scrollRef, onRestored: resetScrollHeader });
  const headerHidden = isMobile && !inMatch && !hideBottomNav && scrollHeaderHidden;
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
            <ScrollContainerProvider containerRef={scrollRef}>
              <div
                ref={scrollRef}
                style={
                  {
                    // Offset des bandes collantes mobiles : elles suivent la topbar,
                    // qui se masque au scroll vers le bas (ou est absente sur l'éditeur d'avatar).
                    "--qu-topbar-offset":
                      headerHidden || hideMobileTopbar ? "0rem" : "4rem",
                  } as CSSProperties
                }
                className={cn(
                  "flex-1",
                  // Routes normales : overscroll par défaut → le pull-to-refresh natif du
                  // navigateur reste possible (le scroll remonte jusqu'au root).
                  // Routes immersives : contenu figé, on neutralise le geste.
                  inMatch
                    ? "overflow-hidden overscroll-y-contain"
                    : "overflow-y-auto",
                )}
              >
                {/* Topbar collante : le contenu défile dessous (verre dépoli) ; sur mobile
                    elle se translate hors écran en descendant (comportement natif). */}
                {!inMatch && !hideMobileTopbar && (
                  <MotionConfig reducedMotion="user">
                    <motion.div
                      className="sticky top-0 z-20"
                      initial={false}
                      animate={{ y: headerHidden ? "-100%" : "0%" }}
                      transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                      inert={headerHidden}
                    >
                      <Topbar onOpenPalette={() => setPaletteOpen(true)} />
                    </motion.div>
                  </MotionConfig>
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
            </ScrollContainerProvider>
            {!inMatch && !hideBottomNav && <BottomNav hidden={headerHidden} />}
          </div>
        </SidebarInset>
      </SidebarProvider>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <LobbyInvitationDialog />
    </TooltipProvider>
  );
}
