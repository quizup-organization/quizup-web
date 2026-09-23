import { useNavigate, useLocation } from "react-router-dom";
import { Flame, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { ProfileMenu } from "./ProfileMenu";
import { Breadcrumb, type Crumb } from "./Breadcrumb";
import { useCurrentPlayer } from "../hooks/useCurrentPlayer";
import { useLogout } from "@/features/auth";
import { queryKeys } from "@/lib/query-keys";
import { compactNumber } from "@/lib/helpers";
import { topicsService } from "@/lib/services/topics";
import { profilesService } from "@/lib/services/profiles";
import { categoryLabel } from "@/shared/utils/categories";

const ROUTE_SUBTITLES: Record<string, string> = {
  home: "Reprends un duel ou pars en chercher un nouveau.",
  topics: "Cherche, filtre, trie : le catalogue entier est ici.",
  people: "Les joueurs que tu suis et ceux qui te suivent.",
  challenges: "Tes défis en cours.",
  profile: "Ta progression et tous tes duels.",
  player: "Profil public, en lecture seule.",
  settings: "Compte, profil et préférences.",
};

interface TopbarProps {
  onOpenPalette: () => void;
}

/** Barre supérieure : fil d'Ariane + sous-titre, série, palette ⌘K, menu profil (mobile). */
export function Topbar({ onOpenPalette }: TopbarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile, progression, userId } = useCurrentPlayer();
  const logout = useLogout();

  const topicId = pathname.startsWith("/topics/") ? pathname.split("/")[2] : "";
  const playerId = pathname.startsWith("/players/") ? pathname.split("/")[2] : "";

  const topicQuery = useQuery({
    queryKey: queryKeys.topics.detail(topicId),
    queryFn: () => topicsService.getById(topicId),
    enabled: !!topicId,
    staleTime: 10 * 60 * 1000,
  });
  const playerQuery = useQuery({
    queryKey: queryKeys.profiles.detail(playerId),
    queryFn: () => profilesService.getById(playerId),
    enabled: !!playerId,
    staleTime: 10 * 60 * 1000,
  });

  const player = {
    name: profile?.displayName ?? userId ?? "Joueur",
    level: progression?.level ?? 1,
    xp: progression?.xpTotal ?? 0,
    xpForNextLevel: progression?.xpForNextLevel ?? 500,
  };

  const { crumbs, subtitle } = buildCrumbs(pathname, navigate, {
    topicName: topicQuery.data?.name,
    topicCategory: topicQuery.data?.category,
    topicFollowers: topicQuery.data?.followersCounter,
    playerName: playerQuery.data?.displayName,
  });

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b bg-background px-3.5 sm:px-6">
      <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
      <div className="min-w-0">
        <Breadcrumb items={crumbs} isMobile={isMobile} />
        <p className="hidden text-xs text-muted-foreground/85 lg:block">
          {subtitle}
        </p>
      </div>

      <div className="flex-1" />

      <Button
        variant="outline"
        onClick={onOpenPalette}
        aria-label="Rechercher un sujet ou un utilisateur"
        className="hidden h-9 w-[280px] justify-start gap-2.5 px-3 font-normal text-muted-foreground lg:inline-flex"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left text-[13px]">
          Chercher un sujet ou un utilisateur…
        </span>
        <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[11px]">
          ⌘K
        </kbd>
      </Button>

      <div
        className="hidden items-center gap-1.5 rounded-md border border-sidebar-border bg-card px-2.5 py-1.5 lg:flex"
        title="Meilleure série de victoires"
      >
        <Flame className="size-4 text-[var(--duel-score)]" />
        <span className="font-heading text-sm font-bold text-[var(--duel-score)]">
          {progression?.duelStats?.bestStreak ?? 0}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={onOpenPalette}
        aria-label="Rechercher"
        className="text-muted-foreground lg:hidden"
      >
        <Search className="size-4" />
      </Button>

      <div className="lg:hidden">
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
  topicCategory?: string;
  topicFollowers?: number;
  playerName?: string;
}

function buildCrumbs(
  pathname: string,
  navigate: (path: string) => void,
  data: CrumbData,
): { crumbs: Crumb[]; subtitle: string } {
  if (pathname.startsWith("/topics/")) {
    return {
      crumbs: [
        { label: "Sujets", onClick: () => navigate("/topics") },
        { label: data.topicName ?? "Sujet" },
      ],
      subtitle:
        data.topicName && data.topicCategory
          ? `${categoryLabel(data.topicCategory, data.topicCategory)} · ${compactNumber(data.topicFollowers ?? 0)} joueurs`
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
  switch (pathname) {
    case "/topics":
      return { crumbs: [{ label: "Sujets" }], subtitle: ROUTE_SUBTITLES.topics };
    case "/people":
      return {
        crumbs: [{ label: "Personnes", onClick: () => navigate("/people") }, { label: "Abonnements" }],
        subtitle: ROUTE_SUBTITLES.people,
      };
    case "/challenges":
      return {
        crumbs: [{ label: "Personnes", onClick: () => navigate("/people") }, { label: "Défis" }],
        subtitle: ROUTE_SUBTITLES.challenges,
      };
    case "/settings":
      return {
        crumbs: [{ label: "Profil", onClick: () => navigate("/profile") }, { label: "Réglages" }],
        subtitle: ROUTE_SUBTITLES.settings,
      };
    case "/profile":
      return { crumbs: [{ label: "Profil" }], subtitle: ROUTE_SUBTITLES.profile };
    default:
      return { crumbs: [{ label: "Accueil" }], subtitle: ROUTE_SUBTITLES.home };
  }
}
