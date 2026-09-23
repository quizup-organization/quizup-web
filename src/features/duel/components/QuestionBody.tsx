import { useEffect, useState } from "react";
import { cn } from "cn";
import { TOKEN } from "@/shared/theme/tokens";
import {
  ANSWER_REVEAL_STAGGER_MS,
  QUESTION_READ_MS,
} from "../lib/duel-constants";
import { AnswerCard, type AnswerState } from "./AnswerCard";

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Facile",
  MEDIUM: "Moyen",
  HARD: "Difficile",
  EXPERT: "Expert",
};

interface QuestionBodyProps {
  questionText: string;
  /** Illustration optionnelle (URL externe) : affichage en grand + réponses en grille 2×2. */
  imageUrl?: string | null;
  /** Difficulté déduite du taux de bonnes réponses (null si inconnue). */
  difficulty?: string | null;
  answers: { choice: string; label: string }[];
  phase: "question" | "reveal";
  yourPick: string | null;
  theirPick: string | null;
  correctAnswer: string | null;
  /** Résultat de ma réponse, connu dès `PLAYER_ANSWERED` (feedback immédiat). */
  yourCorrect: boolean | null;
  /** Le serveur a révélé les réponses et armé le chrono : la saisie est ouverte. */
  inputEnabled: boolean;
  onAnswer: (choice: string) => void;
  round: number;
}

export function QuestionBody({
  questionText,
  imageUrl,
  difficulty,
  answers,
  phase,
  yourPick,
  theirPick,
  correctAnswer,
  yourCorrect,
  inputEnabled,
  onAnswer,
  round,
}: QuestionBodyProps) {
  const revealed = phase === "reveal";
  const locked = yourPick != null;
  const hasImage = !!imageUrl;
  const [answersShown, setAnswersShown] = useState(false);

  useEffect(() => {
    const to = setTimeout(() => setAnswersShown(true), QUESTION_READ_MS);
    return () => clearTimeout(to);
  }, []);

  const cardsVisible = answersShown || revealed;

  const stateOf = (choice: string): AnswerState => {
    if (revealed) {
      if (choice === correctAnswer) return "correct";
      if (yourPick === choice || theirPick === choice) return "wrong";
      return "muted";
    }
    if (yourPick === choice) {
      if (yourCorrect === true) return "correct";
      if (yourCorrect === false) return "wrong";
      return "selected";
    }
    return "idle";
  };

  return (
    <div
      className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center"
      style={{
        gap: "clamp(6px, 1.6dvh, 30px)",
        padding: "clamp(6px, 1.6dvh, 20px) clamp(12px, 3vw, 40px)",
      }}
    >
      {difficulty && DIFFICULTY_LABELS[difficulty] && (
        <span
          className="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
          style={{ borderColor: TOKEN.border }}
        >
          {DIFFICULTY_LABELS[difficulty]}
        </span>
      )}

      {/* La question est prioritaire : jamais tronquée, elle prend la hauteur dont elle a
          besoin ; seules les cases de réponse se réduisent pour lui laisser la place. */}
      <div className="flex w-full shrink-0 items-center justify-center">
        <h2
          key={round}
          className="qu-question-in"
          style={{
            fontFamily: TOKEN.fontDisplay,
            fontSize: hasImage ? "clamp(16px, 2.8dvh, 30px)" : "clamp(19px, 3.8dvh, 36px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.18,
            textAlign: "center",
            maxWidth: "26ch",
          }}
        >
          {questionText}
        </h2>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="qu-question-in w-full shrink-0 object-contain"
          style={{
            width: "min(560px, 100%)",
            maxHeight: "clamp(110px, 26dvh, 280px)",
            borderRadius: 12,
            background: TOKEN.duelSurfaceMuted,
          }}
        />
      )}

      <div
        className={cn(
          "mx-auto min-h-0 w-full",
          hasImage ? "grid flex-1 grid-cols-2 grid-rows-2" : "flex shrink flex-col",
        )}
        style={{ maxWidth: 620, gap: "clamp(6px, 1.2dvh, 13px)" }}
        role="group"
        aria-label="Réponses"
      >
        {cardsVisible &&
          answers.map((answer, index) => (
            <div
              key={answer.choice}
              className="qu-answer-in min-h-0"
              style={{
                animationDelay: `${index * ANSWER_REVEAL_STAGGER_MS}ms`,
                /* Cartes à hauteur fixe (maquette) qui se réduisent seulement si l'espace
                   manque (mobile), au lieu d'être étirées pour remplir. */
                ...(hasImage ? {} : { flex: "0 1 clamp(64px, 13.9dvh, 156px)" }),
              }}
            >
              <AnswerCard
                label={answer.label}
                state={stateOf(answer.choice)}
                notchLeft={yourPick === answer.choice}
                notchRight={revealed && theirPick === answer.choice}
                disabled={!inputEnabled || locked || revealed}
                onClick={() => onAnswer(answer.choice)}
                compact={hasImage}
              />
            </div>
          ))}
      </div>
    </div>
  );
}
