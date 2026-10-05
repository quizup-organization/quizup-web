import { Zap } from "lucide-react";
import { toast } from "sonner";
import { AnimatedNumber } from "@/shared/components/animated-number";
import { Button } from "@/components/ui/button";
import { UserAvatar, type AvatarIdentity } from "@/shared/components/user-avatar";
import { TOKEN, veil } from "@/shared/theme/tokens";
import type { GameResultView } from "../domain/game-dto";
import type { RematchView } from "../domain/rematch";
import { Confetti } from "./Confetti";
import { LevelRing } from "./LevelRing";

export interface RematchPending {
  request: boolean;
  accept: boolean;
  decline: boolean;
  cancel: boolean;
}

interface ResultScreenProps {
  playerName: string;
  opponentName: string;
  playerAvatar?: AvatarIdentity;
  opponentAvatar?: AvatarIdentity;
  playerLevel: number;
  opponentLevel: number | null;
  scores: { you: number; them: number };
  /** Issue autoritaire (gère le forfait à égalité de score) ; sinon dérivée des scores. */
  outcome?: "win" | "loss" | "draw";
  topicName: string;
  /** Bilan BFF (`reward` arrive après projection) ; `null` tant que la vue n'a pas répondu. */
  result: GameResultView | null;
  rematch: RematchView;
  rematchPending: RematchPending;
  botGame: boolean;
  onRematchRequest: () => void;
  onRematchAccept: () => void;
  onRematchDecline: () => void;
  onRematchCancel: () => void;
  onOpenReview: () => void;
  onNewOpponent: () => void;
  onReplayBot: () => void;
  newOpponentPending?: boolean;
  replayPending?: boolean;
  onExit: () => void;
  onShare: () => void;
}

function cancelledRematchLabel(reason: string): string {
  switch (reason) {
    case "EXPIRED":
      return "Revanche expirée";
    case "PLAYER_LEFT":
    case "OPPONENT_LEFT":
      return "Ton adversaire a quitté la page";
    case "CREATE_FAILED":
      return "Revanche indisponible";
    default:
      return "Revanche annulée";
  }
}

interface StatBoxProps {
  label: string;
  value: string;
  hint?: string;
}

function StatBox({ label, value, hint }: StatBoxProps) {
  return (
    <div
      className="flex min-w-[118px] flex-col items-center gap-0.5 rounded-2xl border px-4 py-3"
      style={{
        borderColor: TOKEN.border,
        background: veil(TOKEN.duelSurface, 6),
      }}
    >
      <span
        style={{
          color: TOKEN.duelSurfaceMuted,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: 24,
          fontWeight: 800,
          color: TOKEN.duelSurface,
        }}
      >
        {value}
      </span>
      {hint && (
        <span style={{ color: TOKEN.duelSurfaceMuted, fontSize: 10 }}>
          {hint}
        </span>
      )}
    </div>
  );
}

interface PlayerResultProps {
  name: string;
  level: number | null;
  avatar?: AvatarIdentity;
  score: number;
  scoreColor: string;
  ringColor: string;
}

/** Colonne joueur : avatar cerclé par l'issue, nom, niveau et score animé. */
function PlayerResult({
  name,
  level,
  avatar,
  score,
  scoreColor,
  ringColor,
}: PlayerResultProps) {
  return (
    <div className="flex min-w-0 flex-col items-center" style={{ width: 140 }}>
      <div
        className="rounded-full"
        style={{
          border: `3px solid ${ringColor}`,
          padding: 3,
          boxShadow: `0 0 20px ${veil(ringColor, 50)}`,
        }}
      >
        <UserAvatar
          name={name}
          userId={avatar?.userId}
          avatarOptions={avatar?.avatarOptions}
          size={68}
        />
      </div>
      <div
        className="max-w-full truncate"
        style={{
          color: TOKEN.duelSurface,
          fontSize: 13.5,
          fontWeight: 600,
          marginTop: 10,
        }}
      >
        {name}
      </div>
      <div
        style={{
          color: TOKEN.duelSurfaceMuted,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {level != null ? `NIVEAU ${level}` : "NIVEAU —"}
      </div>
      <div
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: 40,
          fontWeight: 800,
          color: scoreColor,
          lineHeight: 1.1,
        }}
      >
        <AnimatedNumber value={score} />
      </div>
    </div>
  );
}

/**
 * Écran de résultat du duel (maquette sombre) : bilan sportif, récompense/XP, revanche
 * (humain) ou rejeu (bot), revue des questions et partage.
 */
export function ResultScreen({
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  playerLevel,
  opponentLevel,
  scores,
  outcome,
  topicName,
  result,
  rematch,
  rematchPending,
  botGame,
  onRematchRequest,
  onRematchAccept,
  onRematchDecline,
  onRematchCancel,
  onOpenReview,
  onNewOpponent,
  onReplayBot,
  newOpponentPending,
  replayPending,
  onExit,
  onShare,
}: ResultScreenProps) {
  const win = outcome ? outcome === "win" : scores.you > scores.them;
  const draw = outcome ? outcome === "draw" : scores.you === scores.them;
  const accent = draw ? TOKEN.score : win ? TOKEN.correctAccent : TOKEN.wrongAccent;
  const mutedRing = TOKEN.duelSurfaceMuted;
  const yourRing = draw ? mutedRing : win ? TOKEN.correctAccent : TOKEN.wrongAccent;
  const theirRing = draw ? mutedRing : win ? TOKEN.wrongAccent : TOKEN.correctAccent;

  const reward = result?.reward ?? null;
  const outgoingPending = rematch.outgoingPending && !rematch.declined;
  const showRematchButton =
    !botGame &&
    rematch.opponentPresent &&
    !outgoingPending &&
    !rematch.incomingRequest;
  const hasPrimaryAction =
    botGame || outgoingPending || rematch.incomingRequest || showRematchButton;
  const statusMessage = rematch.declined
    ? "Revanche refusée"
    : rematch.cancelledReason
      ? cancelledRematchLabel(rematch.cancelledReason)
      : null;

  return (
    <div
      className="qu-pop qu-immersive-safe relative flex h-full flex-1 flex-col items-center overflow-y-auto overscroll-y-contain"
      style={{
        background: TOKEN.duelBg,
        color: TOKEN.duelSurface,
        padding: "clamp(18px, 4dvh, 32px) 16px",
      }}
    >
      {win && <Confetti />}

      <div
        style={{
          color: accent,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
        }}
      >
        FIN DU DUEL
      </div>
      <div
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: 46,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: accent,
          lineHeight: 1.1,
          marginTop: 4,
        }}
      >
        {draw ? "Égalité" : win ? "Victoire" : "Défaite"}
      </div>
      {topicName && (
        <div
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: 12.5,
            marginTop: 6,
          }}
        >
          {topicName}
        </div>
      )}

      <div
        className="flex items-start justify-center"
        style={{ gap: "clamp(20px, 6vw, 40px)", marginTop: 24 }}
      >
        <PlayerResult
          name={playerName}
          level={playerLevel}
          avatar={playerAvatar}
          score={scores.you}
          scoreColor={accent}
          ringColor={yourRing}
        />
        <Zap
          size={26}
          fill={TOKEN.mutedFg}
          color={TOKEN.mutedFg}
          strokeWidth={0}
          style={{ marginTop: 26 }}
        />
        <PlayerResult
          name={opponentName}
          level={opponentLevel}
          avatar={opponentAvatar}
          score={scores.them}
          scoreColor={TOKEN.duelSurfaceMuted}
          ringColor={theirRing}
        />
      </div>

      <div
        className="flex flex-wrap items-stretch justify-center gap-2.5"
        style={{ marginTop: 26 }}
      >
        <StatBox label="SCORE DU MATCH" value={String(result?.myScore ?? scores.you)} />
        <StatBox
          label="BONUS RAPIDITÉ"
          value={reward == null ? "···" : `+${result?.speedBonus ?? 0}`}
          hint="inclus dans le score"
        />
        <StatBox
          label="BONUS VICTOIRE"
          value={reward == null ? "···" : `+${reward.victoryBonus}`}
        />
        <StatBox
          label="XP TOTALE"
          value={reward == null ? "···" : `${reward.xp}`}
        />
      </div>

      <div style={{ marginTop: 26 }}>
        <LevelRing
          level={result?.progression.level ?? playerLevel}
          progressPercent={result?.progression.levelProgressPercent ?? 0}
          xpTotal={result?.progression.xpTotal ?? 0}
          xpForNextLevel={result?.progression.xpForNextLevel ?? 0}
          xpGained={reward?.xp ?? null}
        />
      </div>

      {statusMessage && (
        <p style={{ color: TOKEN.duelSurfaceMuted, fontSize: 13, marginTop: 18 }}>
          {statusMessage}
        </p>
      )}

      {rematch.incomingRequest && !rematch.declined && (
        <div
          className="w-full max-w-md rounded-2xl border px-4 py-3 text-center"
          style={{
            marginTop: 18,
            borderColor: TOKEN.primary,
            background: veil(TOKEN.primary, 14),
          }}
        >
          <p style={{ color: TOKEN.duelSurface, fontSize: 13.5, fontWeight: 600 }}>
            {opponentName} te propose une revanche
          </p>
          <div className="mt-3 flex items-center justify-center gap-2.5">
            <Button
              size="sm"
              onClick={onRematchAccept}
              disabled={rematchPending.accept}
            >
              Accepter
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onRematchDecline}
              disabled={rematchPending.decline}
            >
              Refuser
            </Button>
          </div>
        </div>
      )}

      <div
        className="flex flex-wrap items-center justify-center gap-2.5"
        style={{ marginTop: 26 }}
      >
        {botGame && (
          <Button size="lg" onClick={onReplayBot} disabled={replayPending}>
            Rejouer
          </Button>
        )}

        {!botGame && outgoingPending && (
          <div className="flex items-center gap-2.5 rounded-4xl border border-border px-4 py-1.5">
            <span
              style={{ color: TOKEN.duelSurfaceMuted, fontSize: 13.5 }}
            >
              Revanche envoyée — en attente…
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={onRematchCancel}
              disabled={rematchPending.cancel}
            >
              Annuler
            </Button>
          </div>
        )}

        {showRematchButton && (
          <Button
            size="lg"
            onClick={onRematchRequest}
            disabled={rematchPending.request}
          >
            Revanche
          </Button>
        )}

        <Button
          size="lg"
          variant={hasPrimaryAction ? "outline" : "default"}
          onClick={onNewOpponent}
          disabled={newOpponentPending}
        >
          Nouvel adversaire
        </Button>
        <Button size="lg" variant="outline" onClick={onOpenReview}>
          Détails
        </Button>
        <Button size="lg" variant="outline" onClick={onShare}>
          Partager
        </Button>
        <Button
          size="lg"
          variant="ghost"
          style={{ color: TOKEN.duelSurfaceMuted }}
          onClick={() => {
            // TODO: brancher le signalement (endpoint backend différé).
            toast.info("Le signalement arrive bientôt");
          }}
        >
          Signaler
        </Button>
        <Button
          size="lg"
          variant="ghost"
          style={{ color: TOKEN.duelSurfaceMuted }}
          onClick={onExit}
        >
          Retour au sujet
        </Button>
      </div>
    </div>
  );
}
