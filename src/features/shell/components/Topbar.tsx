import { useNavigate, useLocation } from "react-router-dom";
import { Flame, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { Button, Kbd } from "@heroui/react";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { ProfileMenu } from "./ProfileMenu";
import { Breadcrumb, type Crumb } from "./Breadcrumb";
import { useMe } from "../hooks/useMe";
import { useLogout } from "@/features/auth";
import { compactNumber } from "@/lib/helpers";
import { useTopicOverview } from "@/features/topic";
import { usePlayerProfile } from "@/features/player";
import { useSidebarStore } from "../stores/useSidebarStore";

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
  const { data: me, userId } = useMe();
  const meProfile = usePlayerProfile(userId ?? "");
  const logout = useLogout();
  const sidebarOpen = useSidebarStore((s) => s.open);
  const toggleSidebar = useSidebarStore((s) => s.toggle);

  const topicId = pathname.startsWith("/topics/") ? pathname.split("/")[2] : "";
  const playerId = pathname.startsWith("/players/") ? pathname.split("/")[2] : "";

  const topicQuery = useTopicOverview(topicId);
  const playerQuery = usePlayerProfile(playerId);

  const player = {
    name: me?.pseudonym ?? userId ?? "Joueur",
    level: me?.progression.level ?? 1,
    xp: me?.progression.xpTotal ?? 0,
    xpForNextLevel: me?.progression.xpForNextLevel ?? 500,
    userId: userId ?? undefined,
    avatarOptions: me?.avatarOptions ?? undefined,
  };

  const { crumbs, subtitle } = buildCrumbs(pathname, navigate, {
    topicName: topicQuery.data?.topic.name,
    topicCategoryLabel: topicQuery.data?.topic.categoryLabel,
    topicFollowers: topicQuery.data?.topic.followersCount,
    playerName: playerQuery.data?.pseudonym,
  });

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-separator bg-background px-3.5 sm:px-6">
      <Button
        isIconOnly
        variant="ghost"
        size="sm"
        className="hidden text-muted md:inline-flex"
        aria-label={sidebarOpen ? "Replier la navigation" : "Déplier la navigation"}
        onPress={toggleSidebar}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="size-4" />
        ) : (
          <PanelLeftOpen className="size-4" />
        )}
      </Button>
      <div className="min-w-0">
        <Breadcrumb items={crumbs} isMobile={isMobile} />
        <p className="hidden text-xs text-muted/85 lg:block">
          {subtitle}
        </p>
      </div>

      <div className="flex-1" />

      <Button
        variant="secondary"
        onPress={onOpenPalette}
        aria-label="Rechercher un sujet ou un utilisateur"
        className="hidden h-9 w-[280px] justify-start gap-2.5 px-3 font-normal text-muted lg:inline-flex"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left text-[13px]">
          Chercher un sujet ou un utilisateur…
        </span>
        <Kbd variant="light">
          <Kbd.Abbr keyValue="command" />
          <Kbd.Content>K</Kbd.Content>
        </Kbd>
      </Button>

      <div
        className="hidden items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 lg:flex"
        title="Meilleure série de victoires"
      >
        <Flame className="size-4 text-[var(--duel-score)]" />
        <span className="font-heading text-sm font-bold text-[var(--duel-score)]">
          {meProfile.data?.stats.bestWinStreak ?? 0}
        </span>
      </div>

      <Button
        isIconOnly
        variant="secondary"
        onPress={onOpenPalette}
        aria-label="Rechercher"
        className="text-muted lg:hidden"
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
  topicCategoryLabel?: string | null;
  topicFollowers?: number;
  playerName?: string | null;
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
