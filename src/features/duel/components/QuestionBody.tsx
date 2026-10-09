import { useEffect, useState } from "react"
import { cn } from "cn"
import { TOKEN } from "@/shared/theme/tokens"
import {
  ANSWER_REVEAL_STAGGER_MS,
  QUESTION_READ_MS,
} from "../lib/duel-constants"
import { AnswerCard, type AnswerState } from "./AnswerCard"

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: "Facile",
  MEDIUM: "Moyen",
  HARD: "Difficile",
  EXPERT: "Expert",
}

interface QuestionBodyProps {
  questionText: string
  /** Illustration optionnelle (URL externe) : affichage en grand + réponses en grille 2×2. */
  imageUrl?: string | null
  /** Difficulté déduite du taux de bonnes réponses (null si inconnue). */
  difficulty?: string | null
  answers: { choice: string; label: string }[]
  phase: "question" | "reveal"
  yourPick: string | null
  theirPick: string | null
  correctAnswer: string | null
  /** Résultat de ma réponse, connu dès `PLAYER_ANSWERED` (feedback immédiat). */
  yourCorrect: boolean | null
  /** Choix local sélectionné avant l'écho serveur (feedback optimiste). */
  pendingChoice?: string | null
  /** Le serveur a révélé les réponses et armé le chrono : la saisie est ouverte. */
  inputEnabled: boolean
  onAnswer: (choice: string) => void
  round: number
  /** Client arrivé après le début du round (rattrapage) : pas de délai de lecture ni d'animations. */
  instant?: boolean
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
  pendingChoice = null,
  inputEnabled,
  onAnswer,
  round,
  instant = false,
}: QuestionBodyProps) {
  const revealed = phase === "reveal"
  // Sélection locale optimiste : affichée immédiatement, remplacée par l'écho serveur.
  const pending = pendingChoice != null && yourPick == null && !revealed
  const locked = yourPick != null || pending
  const hasImage = !!imageUrl
  // La latence est figée au montage : `instant` peut passer à vrai ~500 ms après le début du
  // round, ce qui annulerait le timer de lecture si on le suivait (réponses jamais affichées).
  const [late] = useState(instant)
  const [answersShown, setAnswersShown] = useState(late)

  useEffect(() => {
    if (late) return
    const to = setTimeout(() => setAnswersShown(true), QUESTION_READ_MS)
    return () => clearTimeout(to)
  }, [late])

  const cardsVisible = answersShown || revealed

  const stateOf = (choice: string): AnswerState => {
    if (revealed) {
      if (choice === correctAnswer) return "correct"
      if (yourPick === choice || theirPick === choice) return "wrong"
      return "muted"
    }
    if (yourPick === choice) {
      if (yourCorrect === true) return "correct"
      if (yourCorrect === false) return "wrong"
      return "selected"
    }
    if (pending && pendingChoice === choice) return "selected"
    return "idle"
  }

  return (
    <div
      className="@container flex min-h-0 min-w-0 flex-1 flex-col items-center justify-between desktop:justify-center"
      style={{
        gap: "clamp(6px, 1.6dvh, 30px)",
        padding: "clamp(6px, 1.6dvh, 20px) clamp(12px, 3vw, 40px)",
      }}
    >
      {/* Question prioritaire : jamais tronquée, elle prend la hauteur dont elle a besoin ;
          seules les cases de réponse se réduisent pour lui laisser la place. La difficulté
          reste solidaire de l'énoncé (le `justify-between` répartit énoncé / image / réponses). */}
      <div
        className="flex w-full shrink-0 flex-col items-center"
        style={{ gap: "clamp(6px, 1.2dvh, 16px)" }}
      >
        {difficulty && DIFFICULTY_LABELS[difficulty] && (
          <span
            className="shrink-0 rounded-full border px-2.5 py-0.5 text-2xs font-medium tracking-wider text-muted-foreground uppercase"
            style={{ borderColor: TOKEN.border }}
          >
            {DIFFICULTY_LABELS[difficulty]}
          </span>
        )}

        <div className="flex w-full items-center justify-center">
          <h2
            key={round}
            className={cn(!late && "qu-question-in")}
            style={{
              fontFamily: TOKEN.fontDisplay,
              fontSize: hasImage
                ? "var(--duel-question-size-image)"
                : "var(--duel-question-size)",
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
      </div>

      {imageUrl && (
        <img
          src={imageUrl}
          alt=""
          fetchPriority="high"
          decoding="async"
          className={cn(
            "w-full shrink-0 object-contain",
            !late && "qu-question-in"
          )}
          style={{
            width: "min(560px, 100%)",
            maxHeight: "clamp(110px, 26dvh, 280px)",
            borderRadius: 20,
          }}
        />
      )}

      <div
        className={cn(
          "mx-auto min-h-0 w-full",
          hasImage
            ? "grid max-h-(--duel-answer-grid-h) flex-1 grid-cols-2 grid-rows-2"
            : "flex shrink flex-col @min-[520px]:grid @min-[520px]:max-h-(--duel-answer-grid-h) @min-[520px]:flex-1 @min-[520px]:grid-cols-2 @min-[520px]:grid-rows-2"
        )}
        style={{
          maxWidth: "var(--duel-answers-w)",
          gap: "clamp(6px, 1.2dvh, 13px)",
        }}
        role="group"
        aria-label="Réponses"
      >
        {cardsVisible &&
          answers.map((answer, index) => (
            <div
              key={answer.choice}
              className={cn("min-h-0", !late && "qu-answer-in")}
              style={{
                ...(late
                  ? {}
                  : {
                      animationDelay: `${index * ANSWER_REVEAL_STAGGER_MS}ms`,
                    }),
                /* Cartes à hauteur fixe (maquette) qui se réduisent seulement si l'espace
                   manque (mobile), au lieu d'être étirées pour remplir. */
                ...(hasImage ? {} : { flex: "0 1 var(--duel-answer-card-h)" }),
              }}
            >
              <AnswerCard
                label={answer.label}
                state={stateOf(answer.choice)}
                instant={late}
                notchLeft={
                  yourPick === answer.choice ||
                  (pending && pendingChoice === answer.choice)
                }
                notchRight={revealed && theirPick === answer.choice}
                pending={pending && pendingChoice === answer.choice}
                disabled={!inputEnabled || locked || revealed}
                onClick={() => onAnswer(answer.choice)}
                compact={hasImage}
              />
            </div>
          ))}
      </div>
    </div>
  )
}
