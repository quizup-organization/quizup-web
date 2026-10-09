import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { MotionConfig, motion } from "framer-motion"
import { cn } from "cn"
import { ErrorBoundary } from "@/shared/components/ErrorBoundary"
import { clearReturnTo, readReturnTo } from "@/features/auth"
import { PagePattern } from "@/shared/components/page-pattern"
import { ScrollContainerProvider } from "@/shared/components/scroll-container-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { Topbar } from "./Topbar"
import { BottomNav } from "./BottomNav"
import { CommandPalette } from "./CommandPalette"
import { InstallBanner } from "./InstallBanner"
import { UpdateBanner } from "./UpdateBanner"
import { ResumeBanner } from "@/features/home"
import {
  LobbyInvitationDialog,
  useAppBadge,
  useFirstRunPushPrompt,
  useFollowPresenceToasts,
  useNotificationStream,
  usePushMessages,
  usePushSubscriptionSync,
} from "@/features/notifications"
import { useIsImmersiveRoute } from "../hooks/useIsImmersiveRoute"
import { useSidebarStore } from "../stores/useSidebarStore"
import { useBottomNavStore } from "../stores/useBottomNavStore"
import { useVisualViewportVar } from "@/shared/hooks/useVisualViewportVar"
import { useDevice } from "@/shared/hooks/use-device"
import { useScrollHeader } from "@/shared/hooks/useScrollHeader"
import { useScrollRestoration } from "@/shared/hooks/useScrollRestoration"

/**
 * Coquille applicative : sidebar (desktop) + topbar + contenu + nav basse (mobile) + palette ⌘K.
 * Pendant un duel, la sidebar est retirée (arène plein écran) et la topbar est masquée.
 */
export function AppShell() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const sidebarOpen = useSidebarStore((s) => s.open)
  const setSidebarOpen = useSidebarStore((s) => s.setOpen)
  const inMatch = useIsImmersiveRoute()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const device = useDevice()
  const bottomNavVariant = useBottomNavStore((s) => s.variant)
  const scrollRef = useRef<HTMLDivElement>(null)
  // L'éditeur d'avatar porte ses propres bandeaux collants : nav basse masquée partout,
  // topbar masquée en compact (le bandeau preview + les onglets la remplacent).
  const avatarEditor = pathname.startsWith("/settings/avatar")
  const hideBottomNav = avatarEditor
  const hideMobileTopbar = avatarEditor && device === "compact"
  const { hidden: scrollHeaderHidden, reset: resetScrollHeader } =
    useScrollHeader(scrollRef)
  useScrollRestoration({
    containerRef: scrollRef,
    onRestored: resetScrollHeader,
  })
  const headerHidden =
    device === "compact" && !inMatch && !hideBottomNav && scrollHeaderHidden
  useNotificationStream(inMatch)
  useFollowPresenceToasts(inMatch)
  usePushSubscriptionSync()
  usePushMessages()
  useFirstRunPushPrompt()
  useAppBadge()
  useVisualViewportVar()

  // Filet de restauration de la cible mémorisée avant login (ex. lien de salon `/join/:code`) :
  // le `state` OIDC la restaure normalement depuis `/callback`.
  useEffect(() => {
    const returnTo = readReturnTo()
    if (returnTo && returnTo !== pathname) {
      clearReturnTo()
      navigate(returnTo, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Habillage de la nav basse exposé au CSS (`--bottom-nav-offset` / `--bottom-nav-reserve`).
  useEffect(() => {
    document.documentElement.dataset.bottomNav = bottomNavVariant
  }, [bottomNavVariant])

  // Sur tablette, la sidebar est un rail replié (contrat device) ; la préférence desktop
  // persiste mais n'est appliquée qu'à partir du breakpoint desktop.
  const effectiveSidebarOpen = device === "tablet" ? false : sidebarOpen
  const handleSidebarOpenChange = (open: boolean) => {
    if (device !== "tablet") setSidebarOpen(open)
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <TooltipProvider>
      <SidebarProvider
        open={effectiveSidebarOpen}
        onOpenChange={handleSidebarOpenChange}
        className="h-svh overflow-hidden"
      >
        {/* Duel : la sidebar disparaît complètement pour rendre l'arène plein écran (desktop). */}
        {!inMatch && <AppSidebar />}
        <SidebarInset className="flex min-h-0 flex-col overflow-hidden bg-sidebar dark:bg-background">
          <PagePattern />
          <div className="relative z-10 flex min-h-0 flex-1 flex-col">
            {/* Reprise de partie : épinglée hors du scroll, donc visible quel que soit le défilement. */}
            {!inMatch && <ResumeBanner />}
            {/* Nouveau build déployé : propose un rechargement (hors immersif, non bloquant). */}
            {!inMatch && <UpdateBanner />}
            <ScrollContainerProvider containerRef={scrollRef}>
              <div
                ref={scrollRef}
                data-scroll-root
                style={
                  {
                    // Offset des bandes collantes : elles suivent la topbar, qui se masque
                    // au scroll vers le bas (ou est absente sur l'éditeur d'avatar).
                    "--qu-topbar-offset":
                      headerHidden || hideMobileTopbar
                        ? "var(--qu-safe-top)"
                        : "calc(var(--topbar-h) + var(--qu-safe-top))",
                  } as CSSProperties
                }
                className={cn(
                  "flex-1",
                  // Routes normales : overscroll par défaut → le pull-to-refresh natif du
                  // navigateur reste possible (le scroll remonte jusqu'au root).
                  // Routes immersives : contenu figé, on neutralise le geste.
                  inMatch
                    ? "overflow-hidden overscroll-y-contain"
                    : "overflow-y-auto"
                )}
              >
                {/* Topbar collante : le contenu défile dessous (verre dépoli) ; sur mobile
                    elle se translate hors écran en descendant (comportement natif). */}
                {!inMatch && <InstallBanner />}
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
                {inMatch ? (
                  // Flux immersif desktop : le duel vit dans un mockup tablette paysage
                  // (4:3, largeur dérivée de la hauteur disponible) centré sur un fond plus
                  // profond, texturé par `background.svg`. En tactile, le cadre disparaît :
                  // plein écran natif.
                  <div className="relative flex h-full items-center justify-center desktop:bg-[#050506]">
                    <PagePattern
                      tint="var(--duel-surface)"
                      opacity={0.06}
                      size="280px"
                      className="hidden desktop:block"
                    />
                    <div
                      data-slot="duel-frame"
                      className="relative h-full w-full overflow-hidden desktop:aspect-[4/3] desktop:h-auto desktop:w-[min(100%,calc((100dvh-3rem)*4/3))] desktop:max-w-[1112px] desktop:rounded-[28px] desktop:border desktop:border-white/10 desktop:bg-[var(--duel-bg)] desktop:shadow-2xl"
                    >
                      <ErrorBoundary key={pathname}>
                        <Outlet />
                      </ErrorBoundary>
                    </div>
                  </div>
                ) : (
                  <ErrorBoundary key={pathname}>
                    <Outlet />
                  </ErrorBoundary>
                )}
                {/* Dégage la nav flottante : le dernier contenu peut passer au-dessus. */}
                {!inMatch && !hideBottomNav && (
                  <div
                    className="hidden h-[var(--bottom-nav-reserve)] compact:block"
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
  )
}
