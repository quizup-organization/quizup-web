import { useMemo, useState } from "react";
import { Bot, ChevronLeft, Globe, Users } from "lucide-react";
import { AppDialog } from "@/shared/components/app-dialog";
import { Button, SearchField, ToggleButton } from "@heroui/react";
import { TopicIcon } from "@/shared/components/topic-icon";
import { PersonCard, usePeople } from "@/features/people";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import type { BotDifficulty } from "../domain/game-dto";
import type { TopicCard } from "@/features/topics/domain/topic";

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
  topic: TopicCard;
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

  const peopleQuery = usePeople("following", {
    q: playerQuery,
    sort: "RECENT",
    page: 0,
    size: 100,
  });
  const peopleLoading = peopleQuery.isLoading;

  const followedPlayers = useMemo(() => {
    return [...(peopleQuery.data?.content ?? [])].sort((a, b) =>
      (a.pseudonym ?? "").localeCompare(b.pseudonym ?? "", "fr"),
    );
  }, [peopleQuery.data]);

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
            <Button variant="ghost" onPress={() => setStep(0)}>
              <ChevronLeft size={15} /> Précédent
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="ghost" onPress={onClose}>
            Annuler
          </Button>
          <Button onPress={next} isDisabled={!canProceed || pendingAction}>
            {hasSecondStep && step === 0 ? "Suivant" : "Lancer"}
          </Button>
        </>
      }
    >
      <div className="mb-3.5 flex items-center gap-3 rounded-md border bg-default p-3">
        <TopicIcon topic={topic} size={38} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold">{topic.name}</div>
          <div
            className="mt-px text-xs font-semibold"
            style={{ color: categoryColor(topic.category ?? "") }}
          >
            {categoryLabel(topic.category ?? "", topic.categoryLabel ?? undefined)}
          </div>
        </div>
      </div>

      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="text-xs font-semibold text-muted">
          Étape {step + 1} sur {totalSteps}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-default">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200"
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
                  borderColor: selected ? "var(--accent)" : "var(--border)",
                  background: selected
                    ? "color-mix(in srgb, var(--accent) 8%, transparent)"
                    : "var(--surface)",
                }}
              >
                <Icon
                  size={20}
                  className="mt-0.5 shrink-0"
                  color={selected ? "var(--accent)" : "var(--muted)"}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{choice.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {choice.desc}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="mt-0.5 size-4 shrink-0 rounded-full border-2"
                  style={{
                    borderColor: selected ? "var(--accent)" : "var(--border)",
                    background: selected ? "var(--accent)" : "transparent",
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
              <ToggleButton
                key={option.value}
                size="sm"
                isSelected={difficulty === option.value}
                onChange={() => setDifficulty(option.value)}
              >
                {option.label}
              </ToggleButton>
            ))}
          </div>
        </div>
      )}

      {step === 1 && opponent === "following" && (
        <div>
          <div className="mb-3 font-heading text-[15px] font-bold">
            Choisis un joueur suivi
          </div>
          <SearchField
            aria-label="Chercher un joueur"
            value={playerQuery}
            onChange={setPlayerQuery}
            variant="secondary"
            fullWidth
            className="mb-3"
          >
            <SearchField.Group>
              <SearchField.SearchIcon />
              <SearchField.Input placeholder="Chercher un joueur…" />
              <SearchField.ClearButton />
            </SearchField.Group>
          </SearchField>
          <div className="flex max-h-[260px] flex-col gap-2 overflow-y-auto">
            {peopleLoading && (
              <div className="px-1 py-2.5 text-sm text-muted">
                Chargement…
              </div>
            )}
            {!peopleLoading &&
              followedPlayers.map((person) => (
                <PersonCard
                  key={person.userId}
                  person={person}
                  selected={playerId === person.userId}
                  onOpen={setPlayerId}
                />
              ))}
            {!peopleLoading && followedPlayers.length === 0 && (
              <div className="px-1 py-2.5 text-sm text-muted">
                Aucun joueur suivi à ce nom.
              </div>
            )}
          </div>
        </div>
      )}
    </AppDialog>
  );
}
