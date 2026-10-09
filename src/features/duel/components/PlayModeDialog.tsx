import { useState } from "react";
import {
  Bot,
  ChevronLeft,
  Globe,
  Link2,
  Search,
  Swords,
  UserCheck,
  Users,
} from "lucide-react";
import { AppDialog } from "@/shared/components/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { TopicIcon } from "@/shared/components/topic-icon";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import type { Suggestion } from "@/features/shell/domain/suggestion";
import type { BotDifficulty } from "../domain/game-dto";
import type { PlayerSource } from "../domain/opponents";
import { PlayerSelectRow } from "./PlayerSelectRow";
import type { TopicCard } from "@/features/topics/domain/topic";

type Opponent = "world" | "player" | "bot" | "private";

const DIFFICULTIES: { value: BotDifficulty; label: string; hint: string }[] = [
  { value: "EASY", label: "Facile", hint: "Bot détendu" },
  { value: "NORMAL", label: "Normal", hint: "Équilibré" },
  { value: "HARD", label: "Difficile", hint: "Bot affûté" },
];

const PLAYER_SOURCE_PLACEHOLDERS: Record<PlayerSource, string> = {
  following: "Filtrer tes abonnements…",
  followers: "Filtrer tes abonnés…",
  all: "Chercher un joueur (2 lettres min)…",
};

const PLAYER_SOURCE_EMPTY_LABELS: Record<PlayerSource, string> = {
  following: "Aucun abonnement.",
  followers: "Aucun abonné.",
  all: "Aucun joueur trouvé.",
};

const OPPONENT_CHOICES: {
  id: Opponent;
  icon: typeof Globe;
  title: string;
  desc: string;
}[] = [
  {
    id: "world",
    icon: Globe,
    title: "Défier le monde",
    desc: "Adversaire en direct, apparié par niveau (±5).",
  },
  {
    id: "player",
    icon: Swords,
    title: "Défier un joueur",
    desc: "Invitation nominative : il accepte ou refuse.",
  },
  {
    id: "bot",
    icon: Bot,
    title: "Défier un Bot",
    desc: "Joue contre l'IA, difficulté au choix, immédiat.",
  },
  {
    id: "private",
    icon: Link2,
    title: "Créer un salon",
    desc: "Salon privé à partager par lien (QR à venir).",
  },
];

const PLAYER_SOURCE_CHOICES: {
  id: PlayerSource;
  icon: typeof Globe;
  title: string;
  desc: string;
}[] = [
  {
    id: "following",
    icon: UserCheck,
    title: "Mes abonnements",
    desc: "Les joueurs que tu suis.",
  },
  {
    id: "followers",
    icon: Users,
    title: "Mes abonnés",
    desc: "Les joueurs qui te suivent.",
  },
  {
    id: "all",
    icon: Globe,
    title: "Recherche universelle",
    desc: "Chercher un joueur par pseudonyme (2 lettres min).",
  },
];

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
  topic: TopicCard;
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
  pending?: boolean;
}

/**
 * Popup unique « Lancer un duel » à étapes : qui défier (monde / joueur / bot / salon privé),
 * puis difficulté (bot) ou source (abonnements / abonnés / recherche universelle) puis sélection
 * du joueur cible. Le sujet n'est rappelé qu'à la première étape.
 */
export function PlayModeDialog({
  open,
  onClose,
  topic,
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
  pending,
}: PlayModeDialogProps) {
  const [step, setStep] = useState(0);
  const [opponent, setOpponent] = useState<Opponent>("world");
  const [difficulty, setDifficulty] = useState<BotDifficulty>("NORMAL");
  const [selectedPlayerId, setSelectedPlayerId] = useState("");

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

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Lancer un duel"
      sub="Choisis ton adversaire."
      className="sm:max-w-md"
      bodyClassName="flex flex-col"
      footerClassName="compact:flex-row compact:items-center"
      toolbar={
        <div className="flex flex-col gap-3">
          {/* L'indicateur d'étape précède toujours la recherche. */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-muted-foreground">
              Étape {step + 1} sur {totalSteps}
            </span>
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {step === 2 && opponent === "player" && (
            <div>
              <div className="mb-3 font-heading text-sm font-bold">
                Choisis un joueur
              </div>
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  value={playerQuery}
                  onChange={(event) => onPlayerQueryChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.currentTarget.blur();
                  }}
                  enterKeyHint="search"
                  placeholder={PLAYER_SOURCE_PLACEHOLDERS[playerSource]}
                  className="pl-9"
                />
              </div>
            </div>
          )}
        </div>
      }
      footer={
        <>
          {step > 0 && (
            <Button variant="ghost" onClick={goBack}>
              <ChevronLeft size={15} /> Précédent
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={next} disabled={pendingAction || playerStepIncomplete}>
            {isFinalStep ? "Lancer" : "Suivant"}
          </Button>
        </>
      }
    >
      {step === 0 && (
        <>
          <div
            className="mb-4 flex shrink-0 items-center gap-3.5 rounded-2xl border p-3.5"
            style={{
              borderColor: `color-mix(in srgb, ${topic.color ?? "var(--primary)"} 30%, var(--border))`,
              background: `linear-gradient(120deg, color-mix(in srgb, ${topic.color ?? "var(--primary)"} 16%, transparent), transparent 65%)`,
            }}
          >
            <TopicIcon topic={topic} size={46} className="rounded-[16px] shadow-lg" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-heading text-sm font-extrabold tracking-tight">
                {topic.name}
              </div>
              <div
                className="mt-0.5 truncate text-2xs font-semibold tracking-[0.14em] uppercase"
                style={{
                  color:
                    topic.color ??
                    categoryColor(topic.category ?? ""),
                }}
              >
                {categoryLabel(topic.category ?? "", topic.categoryLabel ?? undefined)}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <div className="font-heading text-sm font-bold">
              Qui veux-tu défier ?
            </div>
            {OPPONENT_CHOICES.map((choice) => (
              <ChoiceCard
                key={choice.id}
                icon={choice.icon}
                title={choice.title}
                desc={choice.desc}
                selected={opponent === choice.id}
                onSelect={() => setOpponent(choice.id)}
              />
            ))}
          </div>
        </>
      )}

      {step === 1 && opponent === "bot" && (
        <div>
          <div className="mb-3 font-heading text-sm font-bold">
            Quelle difficulté ?
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {DIFFICULTIES.map((option) => (
              <Toggle
                key={option.value}
                variant="outline"
                size="sm"
                pressed={difficulty === option.value}
                onPressedChange={() => setDifficulty(option.value)}
              >
                {option.label}
              </Toggle>
            ))}
          </div>
        </div>
      )}

      {step === 1 && opponent === "player" && (
        <div className="flex flex-col gap-2.5">
          <div className="font-heading text-sm font-bold">
            Où chercher ton adversaire ?
          </div>
          {PLAYER_SOURCE_CHOICES.map((choice) => (
            <ChoiceCard
              key={choice.id}
              icon={choice.icon}
              title={choice.title}
              desc={choice.desc}
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
              Saisis au moins 2 lettres pour chercher un joueur.
            </p>
          ) : playersLoading ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Recherche…
            </p>
          ) : playerResults.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              {PLAYER_SOURCE_EMPTY_LABELS[playerSource]}
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
            </div>
          )}
        </div>
      )}
    </AppDialog>
  );
}
