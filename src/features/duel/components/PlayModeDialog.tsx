import { useState } from "react";
import { Bot, ChevronLeft, Globe, Link2 } from "lucide-react";
import { AppDialog } from "@/shared/components/app-dialog";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { TopicIcon } from "@/shared/components/topic-icon";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import type { BotDifficulty } from "../domain/game-dto";
import type { TopicCard } from "@/features/topics/domain/topic";

type Opponent = "world" | "bot" | "private";

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
    id: "private",
    icon: Link2,
    title: "Créer un salon",
    desc: "Salon privé à partager par lien (QR à venir).",
  },
];

interface PlayModeDialogProps {
  open: boolean;
  onClose: () => void;
  topic: TopicCard;
  onStartWorld: () => void;
  onStartBot: (difficulty: BotDifficulty) => void;
  onStartPrivate: () => void;
  pending?: boolean;
}

/**
 * Popup unique « Lancer un duel » à étapes : qui défier (monde / bot / salon privé),
 * puis difficulté (bot). Le sujet est imposé.
 */
export function PlayModeDialog({
  open,
  onClose,
  topic,
  onStartWorld,
  onStartBot,
  onStartPrivate,
  pending,
}: PlayModeDialogProps) {
  const [step, setStep] = useState(0);
  const [opponent, setOpponent] = useState<Opponent>("world");
  const [difficulty, setDifficulty] = useState<BotDifficulty>("NORMAL");

  const hasSecondStep = opponent === "bot";
  const totalSteps = hasSecondStep ? 2 : 1;
  const pendingAction = pending ?? false;

  function launch() {
    if (opponent === "world") onStartWorld();
    else if (opponent === "bot") onStartBot(difficulty);
    else onStartPrivate();
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
          <Button onClick={next} disabled={pendingAction}>
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
            style={{ color: categoryColor(topic.category ?? "") }}
          >
            {categoryLabel(topic.category ?? "", topic.categoryLabel ?? undefined)}
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
    </AppDialog>
  );
}
