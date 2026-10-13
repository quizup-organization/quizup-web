import { useNavigate, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { Flame, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useDevice } from "@/shared/hooks/use-device"
import { ProfileMenu } from "./ProfileMenu"
import { Breadcrumb, type Crumb } from "./Breadcrumb"
import { useMe } from "../hooks/useMe"
import { useTopicName } from "../hooks/useTopicName"
import { useLogout } from "@/features/auth"
import { compactNumber } from "@/lib/helpers"
import { useTopicOverview } from "@/features/topic"
import { usePlayerProfile } from "@/features/player"
import { NotificationBell } from "@/features/notifications"

import type { TranslationKey } from "@/lib/i18n/types"

const ROUTE_SUBTITLES = {
  home: "shell.topbar.subtitles.home",
  topics: "shell.topbar.subtitles.topics",
  people: "shell.topbar.subtitles.people",
  notifications: "shell.topbar.subtitles.notifications",
  profile: "shell.topbar.subtitles.profile",
  player: "shell.topbar.subtitles.player",
  settings: "shell.topbar.subtitles.settings",
  avatar: "shell.topbar.subtitles.avatar",
} as const satisfies Record<string, TranslationKey>

interface TopbarProps {
  onOpenPalette: () => void
}

/** Barre supérieure : fil d'Ariane + sous-titre, série, palette ⌘K, menu profil (mobile). */
export function Topbar({ onOpenPalette }: TopbarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const device = useDevice()
  const { data: me, userId } = useMe()
  const meProfile = usePlayerProfile(userId ?? "")
  const logout = useLogout()

  const topicMatch = /^\/topics\/([^/]+)(?:\/manage)?$/.exec(pathname)
  const topicId =
    topicMatch && topicMatch[1] !== "new" && topicMatch[1] !== "mine"
      ? topicMatch[1]
      : ""
  const playerId = pathname.startsWith("/players/")
    ? pathname.split("/")[2]
    : ""

  const topicQuery = useTopicOverview(topicId)
  const playerQuery = usePlayerProfile(playerId)
  const resolveName = useTopicName()

  const player = {
    name: me?.pseudonym ?? userId ?? t("shell.settings.fallbackPlayer"),
    level: me?.progression.level ?? 1,
    xp: me?.progression.xpTotal ?? 0,
    xpForNextLevel: me?.progression.xpForNextLevel ?? 500,
    userId: userId ?? undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  }

  const { crumbs, subtitle } = buildCrumbs(pathname, navigate, t, {
    topicName: topicQuery.data
      ? resolveName(topicQuery.data.topic.names)
      : undefined,
    topicCategoryLabel: topicQuery.data?.topic.categoryLabel,
    topicFollowers: topicQuery.data?.topic.followersCount,
    playerName: playerQuery.data?.pseudonym,
  })

  return (
    <header className="flex h-[calc(var(--topbar-h)+var(--qu-safe-top))] shrink-0 items-center gap-3 border-b bg-background/70 ps-[calc(var(--topbar-gutter-x)+var(--qu-safe-left))] pe-[calc(var(--topbar-gutter-x)+var(--qu-safe-right))] pt-(--qu-safe-top) backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1 hidden desktop:inline-flex" />
      <div className="min-w-0">
        <Breadcrumb items={crumbs} isMobile={device === "compact"} />
        <p className="hidden text-xs text-muted-foreground/85 desktop:block">
          {subtitle}
        </p>
      </div>

      <div className="flex-1" />

      <Button
        variant="outline"
        onClick={onOpenPalette}
        aria-label={t("shell.topbar.searchAria")}
        className="hidden h-9 w-[280px] justify-start gap-2.5 px-3 font-normal text-muted-foreground desktop:inline-flex"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left text-sm">
          {t("shell.topbar.searchPlaceholder")}
        </span>
        <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-xs">
          ⌘K
        </kbd>
      </Button>

      <div
        className="hidden items-center gap-1.5 rounded-full border border-sidebar-border bg-card px-2.5 py-1.5 desktop:flex"
        title={t("shell.topbar.bestStreak")}
      >
        <Flame className="size-4 text-[var(--duel-score)]" />
        <span className="font-heading text-sm font-bold text-[var(--duel-score)]">
          {meProfile.data?.stats.bestWinStreak ?? 0}
        </span>
      </div>

      <NotificationBell />

      <Button
        variant="outline"
        size="icon"
        onClick={onOpenPalette}
        aria-label={t("shell.topbar.searchShortAria")}
        className="text-muted-foreground desktop:hidden"
      >
        <Search className="size-4" />
      </Button>

      <div className="desktop:hidden">
        <ProfileMenu
          player={player}
          compact
          align="end"
          side="bottom"
          onProfile={() => navigate("/profile")}
          onSettings={() => navigate("/settings")}
          onLogout={logout}
        />
      </div>
    </header>
  )
}

interface CrumbData {
  topicName?: string
  topicCategoryLabel?: string | null
  topicFollowers?: number
  playerName?: string | null
}

function buildCrumbs(
  pathname: string,
  navigate: (path: string) => void,
  t: TFunction,
  data: CrumbData
): { crumbs: Crumb[]; subtitle: string } {
  if (pathname === "/topics/new") {
    return {
      crumbs: [
        { label: t("shell.nav.topics"), onClick: () => navigate("/topics") },
        { label: t("shell.topbar.crumbs.newTopic") },
      ],
      subtitle: t("shell.topbar.subtitles.newTopic"),
    }
  }
  if (/^\/topics\/[^/]+\/manage$/.test(pathname)) {
    return {
      crumbs: [
        { label: t("shell.nav.topics"), onClick: () => navigate("/topics") },
        { label: data.topicName ?? t("shell.topbar.crumbs.topicFallback") },
        { label: t("shell.topbar.crumbs.manage") },
      ],
      subtitle: t("shell.topbar.subtitles.manage"),
    }
  }
  if (pathname.startsWith("/topics/")) {
    return {
      crumbs: [
        { label: t("shell.nav.topics"), onClick: () => navigate("/topics") },
        { label: data.topicName ?? t("shell.topbar.crumbs.topicFallback") },
      ],
      subtitle:
        data.topicName != null
          ? `${data.topicCategoryLabel ?? ""} · ${t(
              "shell.topbar.playersCount",
              {
                count: compactNumber(data.topicFollowers ?? 0),
              }
            )}`
          : "",
    }
  }
  if (pathname.startsWith("/players/")) {
    return {
      crumbs: [
        { label: t("shell.nav.people"), onClick: () => navigate("/people") },
        { label: data.playerName ?? t("shell.topbar.crumbs.playerFallback") },
      ],
      subtitle: t(ROUTE_SUBTITLES.player),
    }
  }
  if (pathname.startsWith("/rooms/")) {
    return {
      crumbs: [{ label: t("shell.topbar.crumbs.privateRoom") }],
      subtitle: t("shell.topbar.subtitles.privateRoom"),
    }
  }
  switch (pathname) {
    case "/topics":
      return {
        crumbs: [{ label: t("shell.nav.topics") }],
        subtitle: t(ROUTE_SUBTITLES.topics),
      }
    case "/people":
      return {
        crumbs: [
          { label: t("shell.nav.people"), onClick: () => navigate("/people") },
          { label: t("shell.topbar.crumbs.subscriptions") },
        ],
        subtitle: t(ROUTE_SUBTITLES.people),
      }
    case "/notifications":
      return {
        crumbs: [{ label: t("shell.nav.notifications") }],
        subtitle: t(ROUTE_SUBTITLES.notifications),
      }
    case "/settings":
      return {
        crumbs: [
          {
            label: t("shell.nav.profile"),
            onClick: () => navigate("/profile"),
          },
          { label: t("shell.topbar.crumbs.settings") },
        ],
        subtitle: t(ROUTE_SUBTITLES.settings),
      }
    case "/settings/avatar":
      return {
        crumbs: [
          {
            label: t("shell.topbar.crumbs.settings"),
            onClick: () => navigate("/settings"),
          },
          { label: t("shell.topbar.crumbs.avatar") },
        ],
        subtitle: t(ROUTE_SUBTITLES.avatar),
      }
    case "/profile":
      return {
        crumbs: [{ label: t("shell.nav.profile") }],
        subtitle: t(ROUTE_SUBTITLES.profile),
      }
    default:
      return {
        crumbs: [{ label: t("shell.nav.home") }],
        subtitle: t(ROUTE_SUBTITLES.home),
      }
  }
}
