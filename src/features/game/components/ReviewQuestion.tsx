import { useMemo, type CSSProperties } from "react";
import type { AvatarIdentity } from "@/shared/components/user-avatar";
import { TOKEN } from "@/shared/theme/tokens";
import {
  firstAnswerPct,
  firstResponder,
  frozenTimeLeft,
  localizedQuestion,
} from "../domain/game";
import type { ReviewRound } from "../domain/review";
import { MatchHeader } from "./MatchHeader";
import { QuestionBody } from "./QuestionBody";
import { ScoreGauge, type GaugeState } from "./ScoreGauge";

interface ReviewQuestionProps {
  review: ReviewRound;
  userId: string;
  opponentId: string | null;
  playerName: string;
  opponentName: string;
  playerAvatar?: AvatarIdentity;
  opponentAvatar?: AvatarIdentity;
  language: string;
  /**
   * Variante **carousel desktop** : hauteur fixe et tokens compacts (questions/réponses plus
   * petits), jauges latérales masquées (les scores restent dans l'en-tête) — le replay tient
   * dans la colonne étroite.
   */
  compact?: boolean;
}

/** Temps de réponse en secondes, à une décimale (« 3,2 s »). */
function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1).replace(".", ",")} s`;
}

function toAnswerList(
  answers: Record<string, string>,
): { choice: string; label: string }[] {
  return Object.keys(answers)
    .sort()
    .map((choice) => ({ choice, label: answers[choice] ?? "" }));
}

/**
 * Replay **exact** d'une manche de duel, figé en phase `reveal` : même `MatchHeader`, mêmes
 * jauges et même `QuestionBody`, chrono et scores arrêtés. Partagé par le bottom sheet tactile
 * (revue mobile) et les slides du carousel desktop — une seule source de rendu.
 */
export function ReviewQuestion({
  review,
  userId,
  opponentId,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  language,
  compact = false,
}: ReviewQuestionProps) {
  const localized = useMemo(
    () => localizedQuestion(review.round, language),
    [review, language],
  );
  const answers = useMemo(() => toAnswerList(localized.answers), [localized]);

  const yourAnswer = review.round.playerAnswers[userId] ?? null;
  const theirAnswer = opponentId
    ? (review.round.playerAnswers[opponentId] ?? null)
    : null;
  const yourPick = yourAnswer?.choice ?? null;
  const theirPick = theirAnswer?.choice ?? null;
  const correctAnswer = review.round.correctAnswer ?? null;

  // Même règle que l'arène en phase `reveal` : le choix égal à la bonne réponse est correct,
  // tous les autres (dont l'absence de réponse) sont fautifs.
  const gauge: { you: GaugeState; them: GaugeState } = {
    you:
      correctAnswer != null
        ? yourPick === correctAnswer
          ? "correct"
          : "wrong"
        : yourAnswer?.correct === true
          ? "correct"
          : yourAnswer?.correct === false
            ? "wrong"
            : "idle",
    them:
      correctAnswer != null
        ? theirPick === correctAnswer
          ? "correct"
          : "wrong"
        : theirAnswer?.correct === true
          ? "correct"
          : theirAnswer?.correct === false
            ? "wrong"
            : "idle",
  };

  const frozenFirstPct = firstAnswerPct(review.round);
  const first = firstResponder(review.round, userId, opponentId);
  const playerNote =
    review.yourTimeMs != null ? formatSeconds(review.yourTimeMs) : undefined;
  const opponentNote =
    review.theirTimeMs != null ? formatSeconds(review.theirTimeMs) : undefined;

  // Tokens compacts : mêmes composants que l'arène, tailles réduites au format de la slide
  // (hauteur 100 % pour épouser la piste du carousel, elle-même étirée sur la colonne).
  const compactVars: CSSProperties | undefined = compact
    ? ({
        height: "100%",
        "--duel-question-size": "18px",
        "--duel-question-size-image": "16px",
        "--duel-answers-w": "100%",
        "--duel-answer-grid-h": "none",
        "--duel-answer-card-h": "44px",
        "--duel-image-max-h": "clamp(80px, 16dvh, 150px)",
        "--duel-ring-size": "64px",
        "--duel-stage-w": "100%",
      } as CSSProperties)
    : undefined;

  return (
    <div
      className={
        compact ? "flex min-h-0 flex-col" : "flex h-full min-h-0 flex-col"
      }
      style={{
        padding: compact
          ? "clamp(6px, 1dvh, 10px) clamp(6px, 1.6vw, 10px)"
          : "clamp(8px, 1.6dvh, 14px) clamp(12px, 4vw, 22px)",
        ...compactVars,
      }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl"
        style={{ border: `1px solid ${TOKEN.border}` }}
      >
        <MatchHeader
          playerName={playerName}
          opponentName={opponentName}
          playerAvatar={playerAvatar}
          opponentAvatar={opponentAvatar}
          scores={review.scoresAfter}
          scoreStates={gauge}
          timeLeft={frozenTimeLeft(review.round)}
          gain={null}
          round={review.index}
          firstAnswerPct={frozenFirstPct}
          instant
          playerNote={playerNote}
          opponentNote={opponentNote}
          playerFirst={first?.playerId === userId}
          opponentFirst={
            opponentId != null && first?.playerId === opponentId
          }
        />
        <div
          className="flex flex-1"
          style={{
            minHeight: 0,
            overflow: "hidden",
            paddingTop: "clamp(4px, 1.2dvh, 8px)",
            paddingBottom: compact ? "clamp(4px, 1.2dvh, 10px)" : "clamp(8px, 3dvh, 26px)",
          }}
        >
          {!compact && (
            <ScoreGauge
              score={review.scoresAfter.you}
              state={gauge.you}
              side="left"
              label={`Score de ${playerName}`}
              instant
            />
          )}
          {answers.length > 0 && localized.questionText ? (
            <QuestionBody
              key={review.index}
              questionText={localized.questionText}
              imageUrl={review.round.imageUrl}
              difficulty={review.round.difficulty}
              answers={answers}
              phase="reveal"
              yourPick={yourPick}
              theirPick={theirPick}
              correctAnswer={correctAnswer}
              yourCorrect={yourAnswer?.correct ?? null}
              inputEnabled={false}
              onAnswer={() => undefined}
              round={review.index}
              instant
              answersLayout={compact ? "grid" : "auto"}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
                Chargement…
              </p>
            </div>
          )}
          {!compact && (
            <ScoreGauge
              score={review.scoresAfter.them}
              state={gauge.them}
              side="right"
              label={`Score de ${opponentName}`}
              instant
            />
          )}
        </div>
      </div>
    </div>
  );
}
