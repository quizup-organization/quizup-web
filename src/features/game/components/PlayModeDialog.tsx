import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bot,
  ChevronLeft,
  Flame,
  Gauge,
  Globe,
  Link2,
  Search,
  Smile,
  Swords,
  UserCheck,
  Users,
} from "lucide-react";
import { AppDialog } from "@/shared/components/app-dialog";
import { SHEET_DETENTS } from "@/shared/theme/sheets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDevice } from "@/shared/hooks/use-device";
import { useLoadMoreOnIntersect } from "@/shared/hooks/useLoadMoreOnIntersect";
import type { Suggestion } from "@/features/shell/domain/suggestion";
import type { BotDifficulty } from "../domain/game-dto";
import type { PlayerSource } from "../domain/opponents";
import { PlayerSelectRow } from "./PlayerSelectRow";

type Opponent = "world" | "player" | "bot" | "private";

const DIFFICULTIES = [
  {
    value: "EASY",
    icon: Smile,
    labelKey: "game.playMode.difficulties.easy.label",
    hintKey: "game.playMode.difficulties.easy.hint",
  },
  {
    value: "NORMAL",
    icon: Gauge,
    labelKey: "game.playMode.difficulties.normal.label",
    hintKey: "game.playMode.difficulties.normal.hint",
  },
  {
    value: "HARD",
    icon: Flame,
    labelKey: "game.playMode.difficulties.hard.label",
    hintKey: "game.playMode.difficulties.hard.hint",
  },
] as const satisfies readonly {
  value: BotDifficulty;
  icon: typeof Globe;
  labelKey: string;
  hintKey: string;
}[];

const PLAYER_SOURCE_KEYS: Record<
  PlayerSource,
  {
    placeholder: `game.playMode.sources.${PlayerSource}.placeholder`;
    empty: `game.playMode.sources.${PlayerSource}.empty`;
  }
> = {
  following: {
    placeholder: "game.playMode.sources.following.placeholder",
    empty: "game.playMode.sources.following.empty",
  },
  followers: {
    placeholder: "game.playMode.sources.followers.placeholder",
    empty: "game.playMode.sources.followers.empty",
  },
  all: {
    placeholder: "game.playMode.sources.all.placeholder",
    empty: "game.playMode.sources.all.empty",
  },
};

const OPPONENT_CHOICES = [
  {
    id: "world",
    icon: Globe,
    titleKey: "game.playMode.choices.world.title",
    descKey: "game.playMode.choices.world.description",
  },
  {
    id: "player",
    icon: Swords,
    titleKey: "game.playMode.choices.player.title",
    descKey: "game.playMode.choices.player.description",
  },
  {
    id: "bot",
    icon: Bot,
    titleKey: "game.playMode.choices.bot.title",
    descKey: "game.playMode.choices.bot.description",
  },
  {
    id: "private",
    icon: Link2,
    titleKey: "game.playMode.choices.private.title",
    descKey: "game.playMode.choices.private.description",
  },
] as const;

const PLAYER_SOURCE_CHOICES = [
  {
    id: "following",
    icon: UserCheck,
    titleKey: "game.playMode.sources.following.title",
    descKey: "game.playMode.sources.following.description",
  },
  {
    id: "followers",
    icon: Users,
    titleKey: "game.playMode.sources.followers.title",
    descKey: "game.playMode.sources.followers.description",
  },
  {
    id: "all",
    icon: Globe,
    titleKey: "game.playMode.sources.all.title",
    descKey: "game.playMode.sources.all.description",
  },
] as const;

interface ChoiceCardProps {
  icon: typeof Globe;
  title: string;
  desc: string;
  selected: boolean;
  onSelect: () => void;
}

/** Carte de choix radio (adversaire, source de recherche) — état sélectionné teinté. */
function ChoiceCard({ icon: Icon, title, desc, selected, onSelect }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors"
      style={{
        borderColor: selected ? "var(--primary)" : "var(--border)",
        background: selected
          ? "color-mix(in srgb, var(--primary) 8%, transparent)"
          : "var(--card)",
      }}
    >
      <Icon
        size={20}
        className="mt-0.5 shrink-0"
        color={selected ? "var(--primary)" : "var(--muted-foreground)"}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">
          {desc}
        </span>
      </span>
      <span
        aria-hidden
        className="mt-0.5 size-4 shrink-0 rounded-full border-2"
        style={{
          borderColor: selected ? "var(--primary)" : "var(--border)",
          background: selected ? "var(--primary)" : "transparent",
        }}
      />
    </button>
  );
}

interface PlayModeDialogProps {
  open: boolean;
  onClose: () => void;
  onStartWorld: () => void;
  onStartBot: (difficulty: BotDifficulty) => void;
  onStartPlayer: (opponentId: string) => void;
  onStartPrivate: () => void;
  /** Recherche du joueur cible (état porté par la page : évite un import croisé duel → shell). */
  playerQuery: string;
  onPlayerQueryChange: (query: string) => void;
  playerSource: PlayerSource;
  onPlayerSourceChange: (source: PlayerSource) => void;
  playerResults: Suggestion[];
  playersLoading: boolean;
  /** Scroll infini de la liste de joueurs (abonnements / abonnés). */
  playersHasMore?: boolean;
  playersLoadingMore?: boolean;
  onLoadMorePlayers?: () => void;
  pending?: boolean;
}

/**
 * Popup unique « Lancer un duel » à étapes : qui défier (monde / joueur / bot / salon privé),
 * puis difficulté (bot) ou source (abonnements / abonnés / recherche universelle) puis sélection
 * du joueur cible.
 */
export function PlayModeDialog({
  open,
  onClose,
  onStartWorld,
  onStartBot,
  onStartPlayer,
  onStartPrivate,
  playerQuery,
  onPlayerQueryChange,
  playerSource,
  onPlayerSourceChange,
  playerResults,
  playersLoading,
  playersHasMore = false,
  playersLoadingMore = false,
  onLoadMorePlayers,
  pending,
}: PlayModeDialogProps) {
  const { t } = useTranslation();
  const compact = useDevice() === "compact";
  const loadMoreRef = useLoadMoreOnIntersect({
    enabled: playersHasMore && !playersLoadingMore,
    onLoadMore: () => onLoadMorePlayers?.(),
  });
  const [step, setStep] = useState(0);
  const [opponent, setOpponent] = useState<Opponent>("world");
  const [difficulty, setDifficulty] = useState<BotDifficulty>("NORMAL");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

  const playerStep = step === 2 && opponent === "player";
  const totalSteps = opponent === "player" ? 3 : opponent === "bot" ? 2 : 1;
  const isFinalStep = step === totalSteps - 1;
  const pendingAction = pending ?? false;
  const playerStepIncomplete =
    isFinalStep && opponent === "player" && !selectedPlayerId;
  const universalQueryMissing =
    playerSource === "all" && playerQuery.trim().length < 2;

  function launch() {
    if (opponent === "world") onStartWorld();
    else if (opponent === "bot") onStartBot(difficulty);
    else if (opponent === "player" && selectedPlayerId) onStartPlayer(selectedPlayerId);
    else if (opponent === "private") onStartPrivate();
  }

  function next() {
    if (!isFinalStep) {
      setStep(step + 1);
      return;
    }
    launch();
  }

  function goBack() {
    if (opponent === "player" && step === 2) setSelectedPlayerId("");
    setStep(step - 1);
  }

  const playerSearchField = (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        autoFocus={playerSource === "all"}
        value={playerQuery}
        onChange={(event) => onPlayerQueryChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") event.currentTarget.blur();
        }}
        enterKeyHint="search"
        placeholder={t(PLAYER_SOURCE_KEYS[playerSource].placeholder)}
        className="pl-9"
      />
    </div>
  );

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={t("game.playMode.title")}
      sub={t("game.playMode.subtitle")}
      className="sm:max-w-md"
      sheetOnTouch
      sheetDetents={SHEET_DETENTS.duel}
      bodyClassName="flex flex-col"
      footerClassName="compact:flex-row compact:items-center"
      toolbar={
        <div className="flex flex-col gap-3">
          {/* L'indicateur d'étape précède toujours la recherche. */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("game.playMode.step", {
                current: step + 1,
                total: totalSteps,
              })}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {playerStep && (
            <div>
              <div className="mb-3 font-heading text-sm font-bold">
                {t("game.playMode.choosePlayer")}
              </div>
              {/* En compact, la recherche reste en bas, juste au-dessus des actions (bottomBar). */}
              {!compact && playerSearchField}
            </div>
          )}
        </div>
      }
      bottomBar={compact && playerStep ? playerSearchField : undefined}
      footer={
        <>
          {step > 0 && (
            <Button variant="ghost" onClick={goBack}>
              <ChevronLeft size={15} /> {t("game.playMode.previous")}
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            {t("game.playMode.cancel")}
          </Button>
          <Button onClick={next} disabled={pendingAction || playerStepIncomplete}>
            {isFinalStep
              ? t("game.playMode.launch")
              : t("game.playMode.next")}
          </Button>
        </>
      }
    >
      {step === 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="font-heading text-sm font-bold">
            {t("game.playMode.whoTitle")}
          </div>
          {OPPONENT_CHOICES.map((choice) => (
            <ChoiceCard
              key={choice.id}
              icon={choice.icon}
              title={t(choice.titleKey)}
              desc={t(choice.descKey)}
              selected={opponent === choice.id}
              onSelect={() => setOpponent(choice.id)}
            />
          ))}
        </div>
      )}

      {step === 1 && opponent === "bot" && (
        <div className="flex flex-col gap-2.5">
          <div className="font-heading text-sm font-bold">
            {t("game.playMode.difficultyTitle")}
          </div>
          {DIFFICULTIES.map((option) => (
            <ChoiceCard
              key={option.value}
              icon={option.icon}
              title={t(option.labelKey)}
              desc={t(option.hintKey)}
              selected={difficulty === option.value}
              onSelect={() => setDifficulty(option.value)}
            />
          ))}
        </div>
      )}

      {step === 1 && opponent === "player" && (
        <div className="flex flex-col gap-2.5">
          <div className="font-heading text-sm font-bold">
            {t("game.playMode.sourceTitle")}
          </div>
          {PLAYER_SOURCE_CHOICES.map((choice) => (
            <ChoiceCard
              key={choice.id}
              icon={choice.icon}
              title={t(choice.titleKey)}
              desc={t(choice.descKey)}
              selected={playerSource === choice.id}
              onSelect={() => {
                setSelectedPlayerId("");
                onPlayerSourceChange(choice.id);
              }}
            />
          ))}
        </div>
      )}

      {step === 2 && opponent === "player" && (
        <div className="flex min-h-0 flex-1 flex-col">
          {universalQueryMissing ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {t("game.playMode.universalMinChars")}
            </p>
          ) : playersLoading ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {t("game.playMode.searching")}
            </p>
          ) : playerResults.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {t(PLAYER_SOURCE_KEYS[playerSource].empty)}
            </p>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-y-contain">
              {playerResults.map((player) => (
                <PlayerSelectRow
                  key={player.id}
                  player={player}
                  selected={selectedPlayerId === player.id}
                  onSelect={() => {
                    // Replie le clavier mobile après sélection (footer accessible).
                    (document.activeElement as HTMLElement | null)?.blur();
                    setSelectedPlayerId(player.id);
                  }}
                />
              ))}
              {playersHasMore && (
                <div
                  ref={loadMoreRef}
                  className="py-3 text-center text-xs text-muted-foreground"
                >
                  {playersLoadingMore ? t("common.app.loading") : "\u00a0"}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AppDialog>
  );
}
