import { useMemo, useRef, useState, type TouchEvent } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { AppDialog } from "@/shared/components/app-dialog";
import { ShareActions } from "@/shared/components/share-actions";
import {
  UserAvatar,
  type AvatarIdentity,
} from "@/shared/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { TOKEN } from "@/shared/theme/tokens";
import { localizedQuestion, type GameState } from "../domain/game";
import { buildReviewRounds, formatAnswerTime } from "../domain/review";
import { questionShareMessage } from "../domain/share";
import { QuestionBody } from "./QuestionBody";

interface QuestionReviewDialogProps {
  open: boolean;
  onClose: () => void;
  game: GameState;
  userId: string;
  opponentId: string | null;
  playerName: string;
  opponentName: string;
  playerAvatar?: AvatarIdentity;
  opponentAvatar?: AvatarIdentity;
  language: string;
  topicId: string | null;
  topicName: string;
}

function toAnswerList(
  answers: Record<string, string>,
): { choice: string; label: string }[] {
  return Object.keys(answers)
    .sort()
    .map((choice) => ({ choice, label: answers[choice] ?? "" }));
}

interface ReviewPlayerProps {
  name: string;
  avatar?: AvatarIdentity;
  score: number;
  timeMs: number | null;
  align: "left" | "right";
}

/** Identité compacte d'une manche : avatar, nom, score cumulé et temps de réponse. */
function ReviewPlayer({
  name,
  avatar,
  score,
  timeMs,
  align,
}: ReviewPlayerProps) {
  return (
    <div
      className={
        align === "left"
          ? "flex min-w-0 items-center gap-2"
          : "flex min-w-0 flex-row-reverse items-center gap-2 text-right"
      }
    >
      <UserAvatar
        name={name}
        userId={avatar?.userId}
        avatarOptions={avatar?.avatarOptions}
        size={34}
      />
      <div className="min-w-0">
        <div className="truncate text-xs font-semibold">{name}</div>
        <div
          style={{
            fontFamily: TOKEN.fontDisplay,
            fontSize: 18,
            fontWeight: 800,
            color: TOKEN.score,
            lineHeight: 1.1,
          }}
        >
          {score}
        </div>
        <div style={{ color: TOKEN.duelSurfaceMuted, fontSize: 11 }}>
          {formatAnswerTime(timeMs)}
        </div>
      </div>
    </div>
  );
}

/**
 * Revue des questions d'un duel terminé : navigation manche par manche (flèches + swipe),
 * scores cumulés, chrono gelé et réponses des deux joueurs. Aucun fetch : tout est dérivé de
 * l'état de partie déjà chargé par l'arène.
 */
export function QuestionReviewDialog({
  open,
  onClose,
  game,
  userId,
  opponentId,
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  language,
  topicId,
  topicName,
}: QuestionReviewDialogProps) {
  const [index, setIndex] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const reviewRounds = useMemo(
    () => buildReviewRounds(game, userId, opponentId),
    [game, userId, opponentId],
  );
  const total = reviewRounds.length;
  const safeIndex = Math.min(index, Math.max(0, total - 1));
  const current = reviewRounds[safeIndex] ?? null;
  const localized = useMemo(
    () => localizedQuestion(current?.round, language),
    [current, language],
  );
  const answers = useMemo(
    () => toAnswerList(localized.answers),
    [localized],
  );

  const topicUrl = topicId
    ? `${window.location.origin}/topics/${topicId}`
    : window.location.origin;

  const previous = () => setIndex(Math.max(0, safeIndex - 1));
  const next = () => setIndex(Math.min(total - 1, safeIndex + 1));

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (event: TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start == null) return;
    const end = event.changedTouches[0]?.clientX ?? start;
    const delta = end - start;
    if (Math.abs(delta) <= 40) return;
    if (delta < 0) next();
    else previous();
  };

  const yourAnswer = current?.round.playerAnswers[userId] ?? null;
  const theirAnswer = opponentId
    ? (current?.round.playerAnswers[opponentId] ?? null)
    : null;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(openNext) => {
          if (!openNext) {
            setIndex(0);
            onClose();
          }
        }}
      >
        <DialogContent className="flex max-h-[min(88dvh,var(--vvh,100dvh))] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="shrink-0 gap-3 border-b px-6 py-4 pr-14">
            <div className="flex items-center justify-between gap-3">
              <DialogTitle className="text-sm font-bold tracking-[0.18em]">
                QUESTIONS
              </DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Question précédente"
                  disabled={safeIndex <= 0}
                  onClick={previous}
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Question suivante"
                  disabled={total === 0 || safeIndex >= total - 1}
                  onClick={next}
                >
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
            <Progress
              value={total === 0 ? 0 : ((safeIndex + 1) / total) * 100}
              className="w-full gap-0"
            />
          </DialogHeader>

          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-6 py-5"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {current ? (
              <div className="flex flex-col gap-4">
                <div
                  className="grid items-center gap-3"
                  style={{
                    gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
                  }}
                >
                  <ReviewPlayer
                    name={playerName}
                    avatar={playerAvatar}
                    score={current.scoresAfter.you}
                    timeMs={current.yourTimeMs}
                    align="left"
                  />
                  <div className="text-center whitespace-nowrap">
                    <div
                      style={{
                        color: TOKEN.timer,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.14em",
                      }}
                    >
                      TEMPS RESTANT
                    </div>
                    <div
                      style={{
                        fontFamily: TOKEN.fontDisplay,
                        fontSize: 22,
                        fontWeight: 700,
                        color: TOKEN.timer,
                      }}
                    >
                      {Math.ceil(current.frozenTimeLeft)}
                    </div>
                  </div>
                  <ReviewPlayer
                    name={opponentName}
                    avatar={opponentAvatar}
                    score={current.scoresAfter.them}
                    timeMs={current.theirTimeMs}
                    align="right"
                  />
                </div>

                <QuestionBody
                  key={current.index}
                  questionText={localized.questionText}
                  imageUrl={current.round.imageUrl}
                  difficulty={current.round.difficulty}
                  answers={answers}
                  phase="reveal"
                  yourPick={yourAnswer?.choice ?? null}
                  theirPick={theirAnswer?.choice ?? null}
                  correctAnswer={current.round.correctAnswer}
                  yourCorrect={yourAnswer?.correct ?? null}
                  inputEnabled={false}
                  onAnswer={() => undefined}
                  round={current.index}
                  instant
                />
              </div>
            ) : (
              <p className="text-sm" style={{ color: TOKEN.duelSurfaceMuted }}>
                Aucune question à revoir.
              </p>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-row items-center justify-between border-t px-6 py-4 sm:justify-between">
            <span
              className="text-xs font-bold tracking-[0.14em]"
              style={{ color: TOKEN.duelSurfaceMuted }}
            >
              QUESTION {safeIndex + 1} : {total}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // TODO: brancher le signalement (endpoint backend différé).
                  toast.info("Le signalement arrive bientôt");
                }}
              >
                Signaler
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!current}
                onClick={() => setShareOpen(true)}
              >
                Partager
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AppDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        title="Partager la question"
        sub={topicName ? `Sujet : ${topicName}` : undefined}
      >
        <ShareActions
          text={questionShareMessage(localized.questionText, topicName)}
          url={topicUrl}
        />
      </AppDialog>
    </>
  );
}
