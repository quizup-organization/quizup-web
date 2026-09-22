import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LogOut } from "lucide-react";
import { AppDialog } from "@/components/app-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { personColor } from "@/features/people/lib/person-color";
import { useCurrentPlayer } from "@/features/shell/hooks/useCurrentPlayer";
import { useTopic } from "@/features/topic/hooks/useTopicDetail";
import { getUserId } from "@/lib/auth";
import { clamp } from "@/lib/helpers";
import { gamesService } from "@/lib/services/games";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import { titleForLevel } from "@/shared/utils/level";
import { TOKEN } from "@/theme/tokens";
import type { BotDifficulty } from "@/shared/types/api";
import type { GameChoice } from "@/shared/types/domain";
import { MatchHeader } from "../components/MatchHeader";
import { CircleTransition } from "../components/CircleTransition";
import { GhostResultScreen } from "../components/GhostResultScreen";
import { QuestionBody } from "../components/QuestionBody";
import { ResultScreen } from "../components/ResultScreen";
import { RoundIntro } from "../components/RoundIntro";
import { ScoreGauge, type GaugeState } from "../components/ScoreGauge";
import { VersusScreen } from "../components/VersusScreen";
import {
  RESULT_DELAY_MS,
  ROUND_INTRO_MS,
  ROUND_SECONDS,
  SWOOSH_DURATION_MS,
  VS_DURATION_MS,
  isBonusRound,
} from "../lib/duel-constants";
import { useAnswerQuestion, useStartDuel } from "../hooks/useDuel";
import { useGameState } from "../hooks/useGameState";
import { useStartMatchmaking } from "../hooks/useMatchmaking";
import { instantToMillis, useServerClock } from "../hooks/useServerClock";
import { displayTimeLeft, type GameRoundState } from "../domain/game";

type ArenaPhase = "vs" | "swoosh" | "intro" | "question" | "reveal" | "result";

interface RevealInfo {
  revealedAt: number;
  answerDeadlineAt: number;
}

function isGameChoice(value: string): value is GameChoice {
  return value === "A" || value === "B" || value === "C" || value === "D";
}

function roundNumberOf(round: string): number {
  const parsed = Number(round.replace("ROUND_", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortGameRounds(
  rounds: Record<string, GameRoundState>,
): GameRoundState[] {
  return Object.values(rounds).sort(
    (a, b) => roundNumberOf(a.round) - roundNumberOf(b.round),
  );
}

function toAnswerList(
  record: Record<string, string> | null | undefined,
): { choice: string; label: string }[] {
  if (!record) return [];
  return Object.keys(record)
    .sort()
    .map((choice) => ({ choice, label: record[choice] }));
}

/** Pourcentage du premier répondant (le plus rapide de la manche). */
function firstAnswerPct(round: GameRoundState | null): number | null {
  if (!round) return null;
  const times = Object.values(round.playerAnswers).map((a) => a.timeMs);
  if (times.length === 0) return null;
  const fastest = Math.min(...times);
  return clamp((1 - fastest / (ROUND_SECONDS * 1000)) * 100, 0, 100);
}

/**
 * Arène de duel. Tout l'état dynamique est dérivé du read model `GameState` (fold des
 * notifications REST + WebSocket) : la projection n'est plus lue, plus de polling.
 */
export function DuelPage() {
  const { gameId = "" } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const userId = getUserId() ?? "";
  const { profile, progression } = useCurrentPlayer();
  const startDuel = useStartDuel();
  const startMatchmaking = useStartMatchmaking();
  const { serverNow } = useServerClock();
  const { game, isLoading, isError } = useGameState(gameId);
  const answer = useAnswerQuestion(gameId);
  const topicQuery = useTopic(game.topicId ?? "");

  const [introStage, setIntroStage] = useState<"vs" | "swoosh" | "done">("vs");
  const [now, setNow] = useState(() => serverNow());
  const [quitOpen, setQuitOpen] = useState(false);
  const [readyFor, setReadyFor] = useState<string | null>(null);

  const isTerminal =
    game.status === "FINISHED" ||
    game.status === "CANCELED" ||
    game.status === "AWAITING_OPPONENT";

  // Partie déjà terminée à l'ouverture (consultation d'un duel passé) : l'intro « versus »
  // n'a pas encore joué et le jeu est déjà terminal → on saute intro + délai de résultat.
  const arrivedFinished = !isLoading && isTerminal && introStage !== "done";

  const isPlayer1 = game.player1Id === userId;
  const myScore = isPlayer1 ? game.player1Score : game.player2Score;
  const theirScore = isPlayer1 ? game.player2Score : game.player1Score;

  const rounds = useMemo(() => sortGameRounds(game.rounds), [game.rounds]);
  const activeRound = useMemo(() => {
    const current = rounds.find((round) => round.phase !== "CLOSED");
    return current ?? rounds[rounds.length - 1] ?? null;
  }, [rounds]);
  const activeIndex = activeRound ? rounds.indexOf(activeRound) : 0;

  // Transition entre deux rounds : on scinde `ROUND_TRANSITION_MS` en révélation du round
  // clos puis intro du round suivant (comme la maquette : reveal puis « TOUR x »).
  const nextRoundIntroAt = useMemo(() => {
    if (activeRound?.phase !== "CLOSED" || !activeRound.nextRoundAt) return null;
    const at = instantToMillis(activeRound.nextRoundAt);
    return at == null ? null : at - ROUND_INTRO_MS;
  }, [activeRound]);
  const showRoundIntro = nextRoundIntroAt != null && now >= nextRoundIntroAt;

  const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
  const opponentName =
    (isPlayer1 ? game.player2Name : game.player1Name) || "Adversaire";
  const opponentColor = opponentId ? personColor(opponentId) : TOKEN.primary;
  const isAsync = game.mode === "ASYNC";
  const opponentHidden = isAsync && !game.player2Id;
  const opponent = game.player2Type;

  const playerLevel = progression?.level ?? 1;
  const playerName = profile?.displayName ?? "Toi";
  const topic = topicQuery.data;
  const topicName = topic?.name ?? "";

  // Animations d'introduction (indépendantes du serveur) — court-circuitées si la partie
  // est déjà terminée à l'ouverture (accès direct au résultat).
  useEffect(() => {
    if (arrivedFinished) return;
    if (introStage === "vs") {
      const to = setTimeout(() => setIntroStage("swoosh"), VS_DURATION_MS);
      return () => clearTimeout(to);
    }
    if (introStage === "swoosh") {
      const to = setTimeout(() => setIntroStage("done"), SWOOSH_DURATION_MS);
      return () => clearTimeout(to);
    }
  }, [introStage, arrivedFinished]);

  // À la fin de la partie, on laisse la jauge de score latérale (transition `height .55s`)
  // et les animations de cases se terminer avant de basculer sur l'écran de résultat.
  useEffect(() => {
    if (!isTerminal || arrivedFinished) return;
    const to = setTimeout(() => setReadyFor(gameId), RESULT_DELAY_MS);
    return () => clearTimeout(to);
  }, [isTerminal, gameId, arrivedFinished]);
  const resultReady = isTerminal && (arrivedFinished || readyFor === gameId);

  // Phase dérivée : anim d'intro, puis état serveur (read model foldé).
  const roundPhase: ArenaPhase = !activeRound
    ? "intro"
    : activeRound.phase === "CLOSED"
      ? showRoundIntro
        ? "intro"
        : "reveal"
      : "question";
  const serverPhase: ArenaPhase = resultReady ? "result" : roundPhase;

  const effectiveIntroStage = arrivedFinished ? "done" : introStage;
  const phase: ArenaPhase =
    effectiveIntroStage === "vs"
      ? "vs"
      : effectiveIntroStage === "swoosh"
        ? "swoosh"
        : serverPhase;

  const roundIndex = activeIndex;
  const currentRound = activeRound;
  // Pendant l'intro de transition, on introduit le round **suivant**.
  const introRoundIndex = showRoundIntro ? activeIndex + 1 : activeIndex;

  const revealInfo = useMemo<RevealInfo | null>(() => {
    if (!currentRound?.revealedAt || !currentRound?.answerDeadlineAt) return null;
    const revealedAt = instantToMillis(currentRound.revealedAt);
    const answerDeadlineAt = instantToMillis(currentRound.answerDeadlineAt);
    if (revealedAt == null || answerDeadlineAt == null) return null;
    return { revealedAt, answerDeadlineAt };
  }, [currentRound]);

  // Chrono : `now` rafraîchi par intervalle ; le temps restant est dérivé de la deadline
  // serveur. On ticke aussi pendant la révélation pour basculer vers l'intro du round suivant.
  useEffect(() => {
    if (phase !== "question" && phase !== "reveal") return;
    const interval = setInterval(() => setNow(serverNow()), 50);
    return () => clearInterval(interval);
  }, [phase, serverNow]);

  const answers = useMemo(
    () => toAnswerList(currentRound?.answers),
    [currentRound],
  );
  const questionText = currentRound?.questionText ?? "";
  const imageUrl = currentRound?.imageUrl ?? null;
  const difficulty = currentRound?.difficulty ?? null;
  const introBonus = isBonusRound(introRoundIndex);
  const correctAnswer = currentRound?.correctAnswer ?? null;

  const yourAnswer = currentRound?.playerAnswers[userId] ?? null;
  const opponentAnswer = opponentId
    ? (currentRound?.playerAnswers[opponentId] ?? null)
    : null;
  const yourPick = yourAnswer?.choice ?? null;
  const theirPick = opponentAnswer?.choice ?? null;
  const roundChoice = yourPick;
  const roundTheirChoice = theirPick;
  const yourCorrect = yourAnswer?.correct ?? null;
  const theirCorrect = opponentAnswer?.correct ?? null;
  const gain =
    yourAnswer || opponentAnswer
      ? { you: yourAnswer?.points ?? 0, them: opponentAnswer?.points ?? 0 }
      : null;
  const firstAnswerPctValue = useMemo(
    () => firstAnswerPct(currentRound),
    [currentRound],
  );

  const isAnswerable =
    phase === "question" &&
    currentRound?.phase === "ANSWERABLE" &&
    !yourPick;
  const timeLeft = revealInfo
    ? clamp((revealInfo.answerDeadlineAt - now) / 1000, 0, ROUND_SECONDS)
    : ROUND_SECONDS;

  const handleAnswer = useCallback(
    (choice: string) => {
      if (yourPick || !isAnswerable) return;
      if (isGameChoice(choice)) answer.mutate(choice);
    },
    [yourPick, isAnswerable, answer],
  );

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center bg-background">
        <p className="text-sm text-muted-foreground">Préparation du duel…</p>
      </div>
    );
  }

  if (isError || game.player1Id == null) {
    return (
      <div className="grid h-full place-items-center bg-background p-6">
        <Card className="items-center gap-3 text-center">
          <div className="text-base font-semibold">Partie introuvable</div>
          <Button variant="outline" onClick={() => navigate("/topics")}>
            Retour aux sujets
          </Button>
        </Card>
      </div>
    );
  }

  const topicId = game.topicId;

  async function abandon() {
    // Abandon en cours de partie (forfait). Si la partie n'a pas encore démarré
    // (`CREATED`/`READY`), l'abandon est refusé : on annule alors la partie.
    await gamesService
      .abandon(gameId)
      .catch(() => gamesService.cancel(gameId))
      .catch(() => undefined);
    navigate(`/topics/${topicId}`);
  }

  const quitDialog = (
    <AppDialog
      open={quitOpen}
      onClose={() => setQuitOpen(false)}
      title="Abandonner la partie ?"
      sub="Tu déclareras forfait et la partie se terminera immédiatement."
      footer={
        <>
          <Button variant="ghost" onClick={() => setQuitOpen(false)}>
            Continuer
          </Button>
          <Button
            onClick={() => {
              setQuitOpen(false);
              void abandon();
            }}
          >
            <LogOut size={15} /> Abandonner
          </Button>
        </>
      }
    >
      <span className="text-[13px] leading-relaxed text-muted-foreground">
        L&apos;abandon donne la victoire à ton adversaire. Tu peux aussi simplement fermer
        cette fenêtre pour reprendre le duel là où tu l&apos;as laissé.
      </span>
    </AppDialog>
  );

  if (phase === "vs" || phase === "swoosh") {
    return (
      <div
        className="relative flex h-full flex-col overflow-hidden"
        style={{ background: TOKEN.duelBg }}
      >
        <button
          onClick={() => setQuitOpen(true)}
          aria-label="Abandonner la partie"
          className="absolute top-3.5 left-4 z-20 flex h-8 items-center gap-1.5 rounded-md border border-border bg-foreground/5 px-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut size={14} /> Abandonner
        </button>
        <VersusScreen
          player={{
            name: playerName,
            title: titleForLevel(playerLevel),
            level: playerLevel,
            country: profile?.country,
          }}
          opponent={{ name: opponentName, color: opponentColor }}
          topic={{ name: topicName, emoji: topic?.emoji, color: topic?.color }}
        />
        {phase === "swoosh" && <CircleTransition />}
        {quitDialog}
      </div>
    );
  }

  if (phase === "result") {
    const log = rounds.map((round) => {
      const mine = round.playerAnswers[userId];
      return {
        youOk: mine?.choice != null && mine.choice === round.correctAnswer,
        gy: mine?.points ?? 0,
      };
    });
    const correctCount = log.filter((entry) => entry.youOk).length;
    const won = game.winnerId != null && game.winnerId === userId;
    const outcome: "win" | "loss" | "draw" =
      game.winnerId == null ? "draw" : won ? "win" : "loss";
    const xpGain = 20 + correctCount * 12 + (won ? 40 : 0);

    if (isAsync) {
      const isReplay = !!game.player2Id;
      return (
        <GhostResultScreen
          variant={isReplay ? "compare" : "record"}
          playerName={playerName}
          opponentName={opponentName}
          opponentColor={opponentColor}
          topicName={topicName}
          myScore={myScore}
          otherScore={theirScore}
          correct={correctCount}
          xpGain={isReplay ? xpGain : undefined}
          onExit={() =>
            navigate(isReplay ? `/topics/${topicId}` : "/challenges")
          }
        />
      );
    }

    return (
      <ResultScreen
        playerName={playerName}
        opponentName={opponentName}
        opponentColor={opponentColor}
        scores={{ you: myScore, them: theirScore }}
        outcome={outcome}
        log={log}
        topicName={topicName}
        xpGain={xpGain}
        onExit={() => navigate(`/topics/${topicId}`)}
        onReplay={() => {
          if (opponent === "HUMAN") {
            startMatchmaking.mutate(topicId as string);
          } else {
            startDuel.mutate({
              topicId: topicId as string,
              playerName,
              difficulty: (game.botDifficulty as BotDifficulty) ?? "NORMAL",
            });
          }
        }}
        replayPending={startDuel.isPending || startMatchmaking.isPending}
      />
    );
  }

  const gauge: { you: GaugeState; them: GaugeState } = {
    you:
      phase === "reveal" && correctAnswer != null
        ? roundChoice === correctAnswer
          ? "correct"
          : "wrong"
        : yourCorrect === true
          ? "correct"
          : yourCorrect === false
            ? "wrong"
            : "idle",
    them:
      phase === "reveal" && correctAnswer != null
        ? roundTheirChoice === correctAnswer
          ? "correct"
          : "wrong"
        : theirCorrect === true
          ? "correct"
          : theirCorrect === false
            ? "wrong"
            : "idle",
  };

  // Chrono affiché : gelé à la révélation (temps de clôture serveur), plein à l'intro,
  // décompte pendant la question. Barre et numéro partagent cette valeur (reset simultané).
  const timeLeftDisplay = displayTimeLeft(
    phase === "reveal" ? "reveal" : phase === "intro" ? "intro" : "question",
    timeLeft,
    currentRound,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: TOKEN.duelBg }}>
      <MatchHeader
        playerName={playerName}
        opponentName={opponentName}
        opponentColor={opponentColor}
        scores={{ you: myScore, them: theirScore }}
        scoreStates={{ you: gauge.you, them: gauge.them }}
        timeLeft={timeLeftDisplay}
        gain={gain}
        round={roundIndex}
        firstAnswerPct={firstAnswerPctValue}
        opponentHidden={opponentHidden}
        onQuit={() => setQuitOpen(true)}
      />
      <div
        className="flex flex-1"
        style={{
          minHeight: 0,
          overflow: "hidden",
          paddingTop: "clamp(4px, 1.2dvh, 8px)",
          paddingBottom: "clamp(8px, 3dvh, 26px)",
        }}
      >
        <ScoreGauge
          score={myScore}
          state={gauge.you}
          side="left"
          label={`Score de ${playerName}`}
        />
        {phase === "intro" ? (
          <RoundIntro
            topicName={topicName}
            topicEmoji={topic?.emoji}
            categoryLabel={topic ? categoryLabel(topic.category) : ""}
            categoryColor={topic ? categoryColor(topic.category) : TOKEN.primary}
            round={introRoundIndex}
            bonus={introBonus}
          />
        ) : answers.length > 0 && questionText ? (
          <QuestionBody
            key={roundIndex}
            questionText={questionText}
            imageUrl={imageUrl}
            difficulty={difficulty}
            answers={answers}
            phase={phase === "reveal" ? "reveal" : "question"}
            yourPick={yourPick}
            theirPick={theirPick}
            correctAnswer={correctAnswer}
            yourCorrect={yourCorrect}
            inputEnabled={isAnswerable}
            onAnswer={handleAnswer}
            round={roundIndex}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        )}
        {!opponentHidden && (
          <ScoreGauge
            score={theirScore}
            state={gauge.them}
            side="right"
            label={`Score de ${opponentName}`}
          />
        )}
      </div>
      {quitDialog}
    </div>
  );
}
