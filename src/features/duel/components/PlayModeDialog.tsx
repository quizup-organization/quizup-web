import { useMemo, useState } from "react";
import { Bot, Check, ChevronLeft, Globe, Search, Users } from "lucide-react";
import { AppDialog } from "@/shared/components/app-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import { usePeople } from "@/features/people";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import type { BotDifficulty } from "@/shared/types/api";
import type { Topic } from "@/shared/types/domain";

type Opponent = "world" | "bot" | "following";

const DIFFICULTIES: { value: BotDifficulty; label: string; hint: string }[] = [
  { value: "EASY", label: "Facile", hint: "Bot détendu" },
  { value: "NORMAL", label: "Normal", hint: "Équilibré" },
  { value: "HARD", label: "Difficile", hint: "Bot affûté" },
];

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
    id: "bot",
    icon: Bot,
    title: "Défier un Bot",
    desc: "Joue contre l'IA, difficulté au choix, immédiat.",
  },
  {
    id: "following",
    icon: Users,
    title: "Défier un joueur suivi",
    desc: "Défi privé : il rejoint quand il veut.",
  },
];

interface PlayModeDialogProps {
  open: boolean;
  onClose: () => void;
  topic: Topic;
  onStartWorld: () => void;
  onStartBot: (difficulty: BotDifficulty) => void;
  onStartFollowed: (playerId: string) => void;
  pending?: boolean;
}

/**
 * Popup unique « Lancer un duel » à étapes : qui défier (monde / bot / joueur suivi),
 * puis difficulté (bot) ou sélection d'un joueur suivi (inline). Le sujet est imposé.
 */
export function PlayModeDialog({
  open,
  onClose,
  topic,
  onStartWorld,
  onStartBot,
  onStartFollowed,
  pending,
}: PlayModeDialogProps) {
  const [step, setStep] = useState(0);
  const [opponent, setOpponent] = useState<Opponent>("world");
  const [difficulty, setDifficulty] = useState<BotDifficulty>("NORMAL");
  const [playerId, setPlayerId] = useState<string>("");
  const [playerQuery, setPlayerQuery] = useState("");

  const { people, isLoading: peopleLoading } = usePeople("following");

  const followedPlayers = useMemo(() => {
    const needle = playerQuery.trim().toLowerCase();
    return people
      .filter((person) => !needle || person.displayName.toLowerCase().includes(needle))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, "fr"));
  }, [people, playerQuery]);

  const hasSecondStep = opponent !== "world";
  const totalSteps = hasSecondStep ? 2 : 1;
  const canProceed = step === 0 ? true : opponent === "bot" ? true : playerId !== "";
  const pendingAction = pending ?? false;

  function launch() {
    if (opponent === "world") onStartWorld();
    else if (opponent === "bot") onStartBot(difficulty);
    else if (playerId) onStartFollowed(playerId);
  }

  function next() {
    if (!hasSecondStep) launch();
    else if (step === 0) setStep(1);
    else launch();
  }

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Lancer un duel"
      sub="Choisis ton adversaire."
      className="sm:max-w-md"
      footer={
        <>
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ChevronLeft size={15} /> Précédent
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={next} disabled={!canProceed || pendingAction}>
            {hasSecondStep && step === 0 ? "Suivant" : "Lancer"}
          </Button>
        </>
      }
    >
      <div className="mb-3.5 flex items-center gap-3 rounded-md border bg-muted p-3">
        <TopicIcon topic={topic} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{topic.name}</div>
          <div
            className="mt-px text-xs font-semibold"
            style={{ color: categoryColor(topic.category) }}
          >
            {categoryLabel(topic.category, topic.category)}
          </div>
        </div>
      </div>

      <div className="mb-3.5 flex items-center gap-2.5">
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

      {step === 0 && (
        <div className="flex flex-col gap-2.5">
          <div className="font-heading text-[15px] font-bold">
            Qui veux-tu défier ?
          </div>
          {OPPONENT_CHOICES.map((choice) => {
            const selected = opponent === choice.id;
            const Icon = choice.icon;
            return (
              <button
                key={choice.id}
                type="button"
                onClick={() => setOpponent(choice.id)}
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
                  <span className="block text-sm font-semibold">{choice.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {choice.desc}
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
          })}
        </div>
      )}

      {step === 1 && opponent === "bot" && (
        <div>
          <div className="mb-3 font-heading text-[15px] font-bold">
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

      {step === 1 && opponent === "following" && (
        <div>
          <div className="mb-3 font-heading text-[15px] font-bold">
            Choisis un joueur suivi
          </div>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={playerQuery}
              onChange={(event) => setPlayerQuery(event.target.value)}
              placeholder="Chercher un joueur…"
              className="pl-9"
            />
          </div>
          <div className="flex max-h-[260px] flex-col gap-1 overflow-y-auto">
            {peopleLoading && (
              <div className="px-1 py-2.5 text-sm text-muted-foreground">
                Chargement…
              </div>
            )}
            {!peopleLoading &&
              followedPlayers.map((person) => {
                const selected = playerId === person.userId;
                return (
                  <button
                    key={person.userId}
                    type="button"
                    onClick={() => setPlayerId(person.userId)}
                    className="flex items-center gap-3 rounded-md border p-2 text-left transition-colors"
                    style={{
                      borderColor: selected ? "var(--primary)" : "transparent",
                      background: selected
                        ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                        : "transparent",
                    }}
                  >
                    <UserAvatar name={person.displayName} size={34} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {person.displayName}
                    </span>
                    {selected && <Check size={16} color="var(--primary)" />}
                  </button>
                );
              })}
            {!peopleLoading && followedPlayers.length === 0 && (
              <div className="px-1 py-2.5 text-sm text-muted-foreground">
                Aucun joueur suivi à ce nom.
              </div>
            )}
          </div>
        </div>
      )}
    </AppDialog>
  );
}
