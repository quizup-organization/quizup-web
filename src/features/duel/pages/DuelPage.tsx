import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { AppDialog } from "@/shared/components/app-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { personColor } from "@/features/people";
import { profilesService } from "@/features/player";
import { useMe } from "@/features/shell";
import { useTopicOverview } from "@/features/topic";
import { getSessionUserId as getUserId } from "@/features/auth";
import { clamp } from "@/lib/helpers";
import { queryKeys } from "@/lib/query-keys";
import type { ApiError } from "@/shared/types/api";
import { gamesService } from "../lib/games";
import { categoryColor, categoryLabel } from "@/shared/utils/categories";
import { titleForLevel } from "@/shared/utils/level";
import { TOKEN } from "@/shared/theme/tokens";
import type { BotDifficulty, GameChoice } from "@/features/duel/domain/game-dto";
import { MatchHeader } from "../components/MatchHeader";
import { CircleTransition } from "../components/CircleTransition";
import { QuestionBody } from "../components/QuestionBody";
import { ResultScreen } from "../components/ResultScreen";
import { RoundIntro } from "../components/RoundIntro";
import { ScoreGauge, type GaugeState } from "../components/ScoreGauge";
import { VersusScreen } from "../components/VersusScreen";
import {
  RESULT_DELAY_MS,
  ROUND_INTRO_MS,
  ROUND_SECONDS,
  isBonusRound,
} from "../lib/duel-constants";
import { planIntro } from "../lib/intro-timing";
import { useAnswerQuestion, useStartDuel } from "../hooks/useDuel";
import { useGameState } from "../hooks/useGameState";
import { useStartMatchmaking } from "../hooks/useMatchmaking";
import { instantToMillis, useServerClock } from "../hooks/useServerClock";
import { preloadImage } from "@/shared/utils/image-preload";
import {
  answerDeadlineMs,
  displayTimeLeft,
  localizedQuestion,
  roundTransitionOverdue,
  type GameRoundState,
} from "../domain/game";

type ArenaPhase = "vs" | "swoosh" | "intro" | "question" | "reveal" | "result";

/** Retard (ms) au-delà duquel le client a raté le début du round : animations d'entrée sautées. */
const LATE_JOIN_MS = 500;

/** Grâce avant de rejouer l'historique REST : au-delà, la trame WS est probablement manquée. */
const TRANSITION_GRACE_MS = 1_500;

/** Intervalle de rattrapage tant qu'une transition serveur attendue reste en retard. */
const CATCH_UP_INTERVAL_MS = 2_500;

/** Délai sans écho serveur après envoi d'une réponse → rejouer l'historique REST. */
const PENDING_ECHO_GRACE_MS = 3_000;

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
  const { data: me } = useMe();
  const startDuel = useStartDuel();
  const startMatchmaking = useStartMatchmaking();
  const { serverNow, synced } = useServerClock();
  const { game, isLoading, isError, isRetrying, refresh } = useGameState(gameId);
  const answer = useAnswerQuestion(gameId);
  const topicQuery = useTopicOverview(game.topicId ?? "");

  const [openedState, setOpenedState] = useState<
    "pending" | "inProgress" | "terminal"
  >("pending");
  const [now, setNow] = useState(() => serverNow());
  const [quitOpen, setQuitOpen] = useState(false);
  const [readyFor, setReadyFor] = useState<string | null>(null);
  // Sélection locale optimiste : affichée dès le clic, remplacée par l'écho serveur
  // (`PLAYER_ANSWERED`). `sentAt` sert au rattrapage REST si l'écho tarde.
  const [pending, setPending] = useState<{
    round: number;
    choice: GameChoice;
    sentAt: number;
  } | null>(null);

  // Précharge toutes les images de questions dès la création de la partie : sur une connexion
  // faible, elles sont déjà en cache quand chaque round se révèle.
  useEffect(() => {
    game.questionImageUrls.forEach((url) => preloadImage(url));
  }, [game.questionImageUrls]);

  const isTerminal = game.status === "FINISHED" || game.status === "CANCELED";

  // Partie déjà terminée à l'ouverture (consultation d'un duel passé) : capturé une seule fois
  // après le chargement de l'historique → accès direct au résultat, sans intro ni délai.
  // `setTimeout(0)` : setState asynchrone (la règle lint interdit le setState synchrone en effet).
  useEffect(() => {
    if (isLoading || openedState !== "pending") return;
    const to = setTimeout(
      () => setOpenedState(isTerminal ? "terminal" : "inProgress"),
      0,
    );
    return () => clearTimeout(to);
  }, [isLoading, isTerminal, openedState]);
  const arrivedFinished = openedState === "terminal";

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

  // Avatars réels des deux joueurs (profil = source des options d'avatar).
  const opponentProfileQuery = useQuery({
    queryKey: queryKeys.profiles.detail(opponentId ?? ""),
    queryFn: () => profilesService.profile(opponentId as string),
    enabled: !!opponentId,
    staleTime: 10 * 60 * 1000,
  });
  const playerAvatar = { userId: userId || undefined, avatarOptions: me?.avatarOptions ?? undefined };
  const opponentAvatar = {
    userId: opponentId ?? undefined,
    avatarOptions: opponentProfileQuery.data?.avatarOptions ?? undefined,
  };

  const opponent = game.player2Type;

  const playerLevel = me?.progression.level ?? 1;
  const playerName = me?.pseudonym ?? "Toi";
  const language = me?.language ?? "fr";
  const topic = topicQuery.data?.topic;
  const topicName = topic?.name ?? "";

  // À la fin de la partie, on laisse la jauge de score latérale (transition `height .55s`)
  // et les animations de cases se terminer avant de basculer sur l'écran de résultat.
  useEffect(() => {
    if (!isTerminal || arrivedFinished) return;
    const to = setTimeout(() => setReadyFor(gameId), RESULT_DELAY_MS);
    return () => clearTimeout(to);
  }, [isTerminal, gameId, arrivedFinished]);
  const resultReady = isTerminal && (arrivedFinished || readyFor === gameId);

  // Intro VS/swoosh recalée sur l'horloge serveur : un client en retard (notifications tardives,
  // rechargement en pleine partie) saute les animations pour rejoindre l'état courant sans
  // perdre de temps de jeu. `activeRound` non nul ⇒ le premier round a déjà démarré côté serveur.
  const firstRoundAtMs = instantToMillis(game.firstRoundAt);
  const introPlan = planIntro(firstRoundAtMs != null ? firstRoundAtMs - now : null);
  const effectiveIntroStage: "vs" | "swoosh" | "done" =
    arrivedFinished || activeRound != null ? "done" : introPlan.stage;

  // Phase dérivée : anim d'intro, puis état serveur (read model foldé).
  const roundPhase: ArenaPhase = !activeRound
    ? "intro"
    : activeRound.phase === "CLOSED"
      ? showRoundIntro
        ? "intro"
        : "reveal"
      : "question";
  const serverPhase: ArenaPhase = resultReady ? "result" : roundPhase;

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

  // Horloge : `now` rafraîchi par intervalle — pilote l'intro recalée serveur (budget avant le
  // premier round) et le décompte dérivé de la deadline. Inutile sur l'écran de résultat.
  useEffect(() => {
    if (phase === "result") return;
    const interval = setInterval(() => setNow(serverNow()), 50);
    return () => clearInterval(interval);
  }, [phase, serverNow]);

  // Salle d'attente : chaque joueur signale son entrée (idempotent). Aucun `leave` au
  // démontage (compatible React StrictMode) ; la sortie est explicite (« Quitter »).
  useEffect(() => {
    void gamesService.join(gameId).catch(() => undefined);
  }, [gameId]);

  const localized = useMemo(
    () => localizedQuestion(currentRound, language),
    [currentRound, language],
  );
  const answers = useMemo(
    () => toAnswerList(localized.answers),
    [localized],
  );
  const questionText = localized.questionText;
  const imageUrl = currentRound?.imageUrl ?? null;
  const difficulty = currentRound?.difficulty ?? null;
  // Client arrivé après le début du round (rattrapage/rechargement) : on saute le délai de
  // lecture et les animations d'entrée pour rendre la question immédiatement.
  const roundShownAtMs = instantToMillis(currentRound?.shownAt);
  const joinedLate =
    roundShownAtMs != null && now - roundShownAtMs > LATE_JOIN_MS;
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

  // Sélection optimiste du round courant, tant que le serveur n'a rien enregistré.
  const pendingAnswer =
    pending && pending.round === roundIndex && phase === "question" && !yourPick
      ? pending
      : null;
  const pendingChoice = pendingAnswer?.choice ?? null;

  // Deadline autoritaire si `QUESTION_REVEALED` est arrivée, sinon projetée sur `revealAt` :
  // le décompte est à l'heure même quand la trame WS est en retard (connexion faible).
  const answerDeadline = answerDeadlineMs(currentRound);
  const timeLeft =
    answerDeadline != null
      ? clamp((answerDeadline - now) / 1000, 0, ROUND_SECONDS)
      : ROUND_SECONDS;

  // Si l'horloge n'est pas encore synchronisée, on ne ferme pas la saisie sur une deadline
  // potentiellement décalée : la phase serveur `ANSWERABLE` reste la seule autorité.
  const withinDeadline = !synced || answerDeadline == null || now < answerDeadline;
  const isAnswerable =
    phase === "question" &&
    currentRound?.phase === "ANSWERABLE" &&
    !yourPick &&
    pendingAnswer == null &&
    withinDeadline;

  // Rattrapage REST : une transition serveur attendue n'est pas arrivée, ou l'écho de ma
  // réponse tarde → on rejoue l'historique au lieu d'attendre le reconnect WS (jusqu'à 30 s).
  const transitionOverdue =
    synced && roundTransitionOverdue(currentRound, now, TRANSITION_GRACE_MS);
  const pendingEchoOverdue =
    pendingAnswer != null && now - pendingAnswer.sentAt > PENDING_ECHO_GRACE_MS;
  const needsCatchUp = transitionOverdue || pendingEchoOverdue;

  useEffect(() => {
    if (!needsCatchUp) return;
    refresh();
    const interval = setInterval(refresh, CATCH_UP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [needsCatchUp, refresh]);

  const handleAnswer = useCallback(
    (choice: string) => {
      if (!isAnswerable || !isGameChoice(choice)) return;
      setPending({ round: roundIndex, choice, sentAt: serverNow() });
      answer.mutate(choice, {
        onError: (error) => {
          // Après les retries automatiques : réseau/timeout, 5xx ou 409 (réponse peut-être
          // déjà enregistrée) → réconcilier par l'historique, sans rien afficher.
          const status = (error as ApiError | undefined)?.statusCode;
          if (status === 409 || status == null || status === 408 || status >= 500) {
            refresh();
          }
        },
      });
    },
    [isAnswerable, roundIndex, serverNow, answer, refresh],
  );

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center bg-background">
        <p className="text-sm text-muted-foreground">
          {isRetrying ? "Connexion instable — reprise…" : "Préparation du duel…"}
        </p>
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

  if (!arrivedFinished && game.status === "CREATED") {
    return (
      <div className="grid h-full place-items-center bg-background p-6">
        <Card className="items-center gap-3 text-center">
          <div className="text-base font-semibold">En attente de l&apos;adversaire…</div>
          <p className="text-[13px] text-muted-foreground">
            La partie démarre dès que vous êtes deux dans l&apos;arène.
          </p>
          <Button
            variant="outline"
            onClick={async () => {
              await gamesService.leave(gameId).catch(() => undefined);
              navigate(topicId ? `/topics/${topicId}` : "/notifications");
            }}
          >
            Quitter
          </Button>
        </Card>
      </div>
    );
  }

  async function abandon() {
    // Abandon toujours valide : le BFF route `cancel` si la partie n'a pas démarré.
    await gamesService.abandon(gameId).catch(() => undefined);
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
            country: me?.country ?? undefined,
            userId: playerAvatar.userId,
            avatarOptions: playerAvatar.avatarOptions,
          }}
          opponent={{
            name: opponentName,
            color: opponentColor,
            userId: opponentAvatar.userId,
            avatarOptions: opponentAvatar.avatarOptions,
          }}
          topic={{
            name: topicName,
            emoji: topic?.emoji ?? undefined,
            color: topic?.color ?? undefined,
            imageUrl: topic?.imageUrl ?? undefined,
          }}
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
    const won = game.winnerId != null && game.winnerId === userId;
    const outcome: "win" | "loss" | "draw" =
      game.winnerId == null ? "draw" : won ? "win" : "loss";

    return (
      <ResultScreen
        playerName={playerName}
        opponentName={opponentName}
        playerAvatar={playerAvatar}
        opponentAvatar={opponentAvatar}
        scores={{ you: myScore, them: theirScore }}
        outcome={outcome}
        log={log}
        topicName={topicName}
        onExit={() => navigate(`/topics/${topicId}`)}
        onReplay={() => {
          if (opponent === "HUMAN") {
            startMatchmaking.mutate(topicId as string);
          } else {
            startDuel.mutate({
              topicId: topicId as string,
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
        playerAvatar={playerAvatar}
        opponentAvatar={opponentAvatar}
        scores={{ you: myScore, them: theirScore }}
        scoreStates={{ you: gauge.you, them: gauge.them }}
        timeLeft={timeLeftDisplay}
        gain={gain}
        round={roundIndex}
        firstAnswerPct={firstAnswerPctValue}
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
            topicEmoji={topic?.emoji ?? undefined}
            topicImageUrl={topic?.imageUrl ?? undefined}
            categoryLabel={topic ? categoryLabel(topic.category ?? "", topic.categoryLabel ?? undefined) : ""}
            categoryColor={topic ? categoryColor(topic.category ?? "") : TOKEN.primary}
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
            pendingChoice={pendingChoice}
            inputEnabled={isAnswerable}
            onAnswer={handleAnswer}
            round={roundIndex}
            instant={joinedLate}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Chargement…</p>
          </div>
        )}
        <ScoreGauge
          score={theirScore}
          state={gauge.them}
          side="right"
          label={`Score de ${opponentName}`}
        />
      </div>
      {quitDialog}
    </div>
  );
}
