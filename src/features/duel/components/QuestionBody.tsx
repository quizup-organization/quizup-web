import { useEffect, useState } from "react";
import { TOKEN } from "@/theme/tokens";
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
        gap: "clamp(12px, 3.5vh, 44px)",
        padding: "clamp(8px, 2.4vh, 24px) clamp(16px, 4vw, 40px)",
        overflow: "hidden",
      }}
    >
      {difficulty && DIFFICULTY_LABELS[difficulty] && (
        <span
          className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wider text-muted-foreground uppercase"
          style={{ borderColor: TOKEN.border }}
        >
          {DIFFICULTY_LABELS[difficulty]}
        </span>
      )}

      <div
        className="flex items-center justify-center"
        style={{ minHeight: hasImage ? undefined : "clamp(64px, 18vh, 150px)" }}
      >
        <h2
          key={round}
          className="qu-question-in"
          style={{
            fontFamily: TOKEN.fontDisplay,
            fontSize: hasImage ? "clamp(20px, 3.6vh, 32px)" : "clamp(24px, 4.6vh, 38px)",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            lineHeight: 1.18,
            textAlign: "center",
            maxWidth: "20ch",
          }}
        >
          {questionText}
        </h2>
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          className="qu-question-in object-contain"
          style={{
            width: "min(560px, 100%)",
            maxHeight: "clamp(140px, 34vh, 300px)",
            borderRadius: 12,
            background: TOKEN.duelSurfaceMuted,
          }}
        />
      )}

      <div
        className={hasImage ? "grid grid-cols-2" : "flex flex-col"}
        style={{ width: "min(620px, 100%)", gap: "clamp(6px, 1.2vh, 13px)" }}
        role="group"
        aria-label="Réponses"
      >
        {cardsVisible &&
          answers.map((answer, index) => (
            <div
              key={answer.choice}
              className="qu-answer-in"
              style={{ animationDelay: `${index * ANSWER_REVEAL_STAGGER_MS}ms` }}
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
