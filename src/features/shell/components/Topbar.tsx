import { useNavigate, useLocation } from "react-router-dom";
import { Flame, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useDevice } from "@/shared/hooks/use-device";
import { ProfileMenu } from "./ProfileMenu";
import { Breadcrumb, type Crumb } from "./Breadcrumb";
import { useMe } from "../hooks/useMe";
import { useTopicName } from "../hooks/useTopicName";
import { useLogout } from "@/features/auth";
import { compactNumber } from "@/lib/helpers";
import { useTopicOverview } from "@/features/topic";
import { usePlayerProfile } from "@/features/player";
import { NotificationBell } from "@/features/notifications";

const ROUTE_SUBTITLES: Record<string, string> = {
  home: "Reprends un duel ou pars en chercher un nouveau.",
  topics: "Cherche, filtre, trie : le catalogue entier est ici.",
  people: "Les joueurs que tu suis et ceux qui te suivent.",
  notifications: "Invitations, défis et abonnements.",
  profile: "Ta progression et tous tes duels.",
  player: "Profil public, en lecture seule.",
  settings: "Compte, profil et préférences.",
  avatar: "Compose ton personnage — enregistrement automatique.",
};

interface TopbarProps {
  onOpenPalette: () => void;
}

/** Barre supérieure : fil d'Ariane + sous-titre, série, palette ⌘K, menu profil (mobile). */
export function Topbar({ onOpenPalette }: TopbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const device = useDevice();
  const { data: me, userId } = useMe();
  const meProfile = usePlayerProfile(userId ?? "");
  const logout = useLogout();

  const topicMatch = /^\/topics\/([^/]+)(?:\/manage)?$/.exec(pathname);
  const topicId =
    topicMatch && topicMatch[1] !== "new" && topicMatch[1] !== "mine"
      ? topicMatch[1]
      : "";
  const playerId = pathname.startsWith("/players/") ? pathname.split("/")[2] : "";

  const topicQuery = useTopicOverview(topicId);
  const playerQuery = usePlayerProfile(playerId);
  const resolveName = useTopicName();

  const player = {
    name: me?.pseudonym ?? userId ?? "Joueur",
    level: me?.progression.level ?? 1,
    xp: me?.progression.xpTotal ?? 0,
    xpForNextLevel: me?.progression.xpForNextLevel ?? 500,
    userId: userId ?? undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  };

  const { crumbs, subtitle } = buildCrumbs(pathname, navigate, {
    topicName: topicQuery.data ? resolveName(topicQuery.data.topic.names) : undefined,
    topicCategoryLabel: topicQuery.data?.topic.categoryLabel,
    topicFollowers: topicQuery.data?.topic.followersCount,
    playerName: playerQuery.data?.pseudonym,
  });

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
        aria-label="Rechercher un sujet ou un utilisateur"
        className="hidden h-9 w-[280px] justify-start gap-2.5 px-3 font-normal text-muted-foreground desktop:inline-flex"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left text-sm">
          Chercher un sujet ou un utilisateur…
        </span>
        <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-xs">
          ⌘K
        </kbd>
      </Button>

      <div
        className="hidden items-center gap-1.5 rounded-full border border-sidebar-border bg-card px-2.5 py-1.5 desktop:flex"
        title="Meilleure série de victoires"
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
        aria-label="Rechercher"
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
  );
}

interface CrumbData {
  topicName?: string;
  topicCategoryLabel?: string | null;
  topicFollowers?: number;
  playerName?: string | null;
}

function buildCrumbs(
  pathname: string,
  navigate: (path: string) => void,
  data: CrumbData,
): { crumbs: Crumb[]; subtitle: string } {
  if (pathname === "/topics/new") {
    return {
      crumbs: [
        { label: "Sujets", onClick: () => navigate("/topics") },
        { label: "Nouveau sujet" },
      ],
      subtitle: "Crée un sujet, ajoute tes questions, puis publie-le au catalogue.",
    };
  }
  if (/^\/topics\/[^/]+\/manage$/.test(pathname)) {
    return {
      crumbs: [
        { label: "Sujets", onClick: () => navigate("/topics") },
        { label: data.topicName ?? "Sujet" },
        { label: "Gestion" },
      ],
      subtitle: "Édite le sujet, ajoute des questions et modère-les.",
    };
  }
  if (pathname.startsWith("/topics/")) {
    return {
      crumbs: [
        { label: "Sujets", onClick: () => navigate("/topics") },
        { label: data.topicName ?? "Sujet" },
      ],
      subtitle:
        data.topicName != null
          ? `${data.topicCategoryLabel ?? ""} · ${compactNumber(data.topicFollowers ?? 0)} joueurs`
          : "",
    };
  }
  if (pathname.startsWith("/players/")) {
    return {
      crumbs: [
        { label: "Personnes", onClick: () => navigate("/people") },
        { label: data.playerName ?? "Joueur" },
      ],
      subtitle: ROUTE_SUBTITLES.player,
    };
  }
  if (pathname.startsWith("/rooms/")) {
    return {
      crumbs: [{ label: "Salon privé" }],
      subtitle: "Salle d'attente — la partie démarre quand les deux joueurs sont là.",
    };
  }
  switch (pathname) {
    case "/topics":
      return { crumbs: [{ label: "Sujets" }], subtitle: ROUTE_SUBTITLES.topics };
    case "/people":
      return {
        crumbs: [{ label: "Personnes", onClick: () => navigate("/people") }, { label: "Abonnements" }],
        subtitle: ROUTE_SUBTITLES.people,
      };
    case "/notifications":
      return {
        crumbs: [{ label: "Notifications" }],
        subtitle: ROUTE_SUBTITLES.notifications,
      };
    case "/settings":
      return {
        crumbs: [{ label: "Profil", onClick: () => navigate("/profile") }, { label: "Réglages" }],
        subtitle: ROUTE_SUBTITLES.settings,
      };
    case "/settings/avatar":
      return {
        crumbs: [{ label: "Réglages", onClick: () => navigate("/settings") }, { label: "Avatar" }],
        subtitle: ROUTE_SUBTITLES.avatar,
      };
    case "/profile":
      return { crumbs: [{ label: "Profil" }], subtitle: ROUTE_SUBTITLES.profile };
    default:
      return { crumbs: [{ label: "Accueil" }], subtitle: ROUTE_SUBTITLES.home };
  }
}
