import type { ReactNode } from "react"
import { ChevronDown, Users, X, Zap } from "lucide-react"
import { AnimatedNumber } from "@/shared/components/animated-number"
import { Button } from "@/components/ui/button"
import {
  UserAvatar,
  type AvatarIdentity,
} from "@/shared/components/user-avatar"
import { TOKEN, veil } from "@/shared/theme/tokens"
import type { GameResultView } from "../domain/game-dto"
import type { RematchView } from "../domain/rematch"
import { Confetti } from "./Confetti"
import { LevelRing } from "./LevelRing"

export interface RematchPending {
  request: boolean
  accept: boolean
  decline: boolean
  cancel: boolean
}

interface ResultScreenProps {
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  playerLevel: number
  opponentLevel: number | null
  playerTitle: string
  opponentTitle: string
  scores: { you: number; them: number }
  /** Issue autoritaire (gère le forfait à égalité de score) ; sinon dérivée des scores. */
  outcome?: "win" | "loss" | "draw"
  topicName: string
  /** Bilan BFF (`reward` arrive après projection) ; `null` tant que la vue n'a pas répondu. */
  result: GameResultView | null
  rematch: RematchView
  rematchPending: RematchPending
  botGame: boolean
  onRematchRequest: () => void
  onRematchAccept: () => void
  onRematchDecline: () => void
  onRematchCancel: () => void
  onOpenReview: () => void
  onNewOpponent: () => void
  onReplayBot: () => void
  newOpponentPending?: boolean
  replayPending?: boolean
  onExit: () => void
}

function cancelledRematchLabel(reason: string): string {
  switch (reason) {
    case "EXPIRED":
      return "Revanche expirée"
    case "PLAYER_LEFT":
    case "OPPONENT_LEFT":
      return "Ton adversaire a quitté la page"
    case "CREATE_FAILED":
      return "Revanche indisponible"
    default:
      return "Revanche annulée"
  }
}

const WHITE = "#ffffff"
const LOSS = "var(--loss)"

interface StatBoxProps {
  label: string
  value: string
  color: string
  hint?: string
}

function StatBox({ label, value, color, hint }: StatBoxProps) {
  return (
    <div
      className="flex min-w-0 flex-col items-center justify-center rounded-xl border text-center"
      style={{
        borderColor: color,
        background: veil(TOKEN.duelSurface, 3),
        padding: "clamp(3px, 0.7dvh, 7px) clamp(2px, 0.7vw, 6px)",
        minHeight: "clamp(38px, 6.2dvh, 58px)",
      }}
    >
      <span
        style={{
          color,
          fontSize: "clamp(7px, 1.05dvh, 9.5px)",
          fontWeight: 800,
          letterSpacing: "0.08em",
          lineHeight: 1.15,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: "clamp(15px, 2.9dvh, 24px)",
          fontWeight: 800,
          color: WHITE,
          lineHeight: 1.1,
        }}
      >
        {value}
      </span>
      {hint && (
        <span
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: "clamp(6.5px, 0.9dvh, 9px)",
          }}
        >
          {hint}
        </span>
      )}
    </div>
  )
}

interface PlayerMetaProps {
  name: string
  title: string
  level: number | null
  color: string
}

/** Nom, titre de progression et niveau d'un joueur (2ᵉ ligne de la maquette). */
function PlayerMeta({ name, title, level, color }: PlayerMetaProps) {
  return (
    <div className="flex min-w-0 flex-col items-center text-center">
      <span
        className="max-w-full truncate"
        style={{
          color,
          fontSize: "clamp(13px, 1.9dvh, 16px)",
          fontWeight: 700,
        }}
      >
        {name}
      </span>
      <span
        className="max-w-full truncate"
        style={{
          color: TOKEN.duelSurfaceMuted,
          fontSize: 11,
          lineHeight: 1.3,
        }}
      >
        {title || "\u00A0"}
      </span>
      <span
        style={{
          color: WHITE,
          fontSize: "clamp(11px, 1.6dvh, 12.5px)",
          fontWeight: 600,
        }}
      >
        {level != null ? `Level ${level}` : "Level —"}
      </span>
    </div>
  )
}

interface RungedAvatarProps {
  name: string
  avatar?: AvatarIdentity
  ringColor: string
}

/** Avatar agrandi, cerclé par l'issue du duel, avec halo doux. */
function RungedAvatar({ name, avatar, ringColor }: RungedAvatarProps) {
  return (
    <div
      className="shrink-0 rounded-full"
      style={{
        width: "clamp(52px, 9dvh, 72px)",
        height: "clamp(52px, 9dvh, 72px)",
        border: `3px solid ${ringColor}`,
        padding: 3,
        boxShadow: `0 0 22px ${veil(ringColor, 45)}`,
      }}
    >
      <UserAvatar
        name={name}
        userId={avatar?.userId}
        avatarOptions={avatar?.avatarOptions}
        size={72}
        fluid
      />
    </div>
  )
}

interface ActionButtonProps {
  icon: ReactNode
  children: ReactNode
  background: string
  disabled?: boolean
  onClick: () => void
}

/** Bouton d'action de l'écran de résultat (height/rayon/police de la maquette). */
function ActionButton({
  icon,
  children,
  background,
  disabled,
  onClick,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="qu-btn flex min-w-0 items-center justify-center gap-2 rounded-[14px] font-bold whitespace-nowrap disabled:opacity-50"
      style={{
        height: "clamp(42px, 6.2dvh, 54px)",
        background,
        color: WHITE,
        fontFamily: TOKEN.fontDisplay,
        fontSize: "clamp(13px, 2dvh, 16px)",
      }}
    >
      <span className="flex shrink-0 items-center">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </button>
  )
}

/**
 * Écran de résultat du duel (maquette sombre Duolingo-like, tient dans le viewport sans
 * scroll) : issue colorée, bilan sportif, donut de niveau, revanche/rejeu et chevron DETAILS
 * vers la revue des questions. Sortie par l'icône X en haut à droite.
 */
export function ResultScreen({
  playerName,
  opponentName,
  playerAvatar,
  opponentAvatar,
  playerLevel,
  opponentLevel,
  playerTitle,
  opponentTitle,
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
}: ResultScreenProps) {
  const win = outcome ? outcome === "win" : scores.you > scores.them
  const draw = outcome ? outcome === "draw" : scores.you === scores.them

  const titleColor = draw ? TOKEN.gauge : win ? TOKEN.timer : LOSS
  const myColor = draw ? WHITE : win ? TOKEN.correctAccent : LOSS
  const theirColor = draw ? WHITE : win ? LOSS : TOKEN.correctAccent
  const myRing = draw ? WHITE : myColor
  const theirRing = draw ? WHITE : theirColor

  const reward = result?.reward ?? null
  const outgoingPending = rematch.outgoingPending && !rematch.declined
  const statusMessage = rematch.declined
    ? "Revanche refusée"
    : rematch.cancelledReason
      ? cancelledRematchLabel(rematch.cancelledReason)
      : null
  const rematchDisabled = rematchPending.request || rematch.incomingRequest
  const showRematchCell =
    botGame ||
    outgoingPending ||
    rematch.incomingRequest ||
    rematch.opponentPresent

  return (
    <div
      className="qu-pop qu-immersive-safe relative flex h-full flex-col items-center overflow-hidden"
      style={{
        background: TOKEN.duelBg,
        color: TOKEN.duelSurface,
        padding: "clamp(10px, 2.2dvh, 22px) clamp(12px, 4vw, 22px)",
      }}
    >
      {win && <Confetti />}

      <button
        type="button"
        onClick={onExit}
        aria-label="Quitter les résultats"
        className="qu-btn absolute z-40 flex items-center justify-center rounded-full border"
        style={{
          top: "calc(env(safe-area-inset-top) + clamp(4px, 1dvh, 10px))",
          right: "clamp(8px, 2.5vw, 16px)",
          width: "clamp(30px, 4.6dvh, 38px)",
          height: "clamp(30px, 4.6dvh, 38px)",
          borderColor: TOKEN.border,
          background: veil(TOKEN.duelSurface, 6),
          color: TOKEN.duelSurfaceMuted,
        }}
      >
        <X size={17} />
      </button>

      <div
        style={{
          color: titleColor,
          fontSize: "clamp(10px, 1.5dvh, 12px)",
          fontWeight: 700,
          letterSpacing: "0.18em",
          marginTop: "clamp(2px, 0.8dvh, 8px)",
        }}
      >
        FIN DU DUEL
      </div>
      <div
        style={{
          fontFamily: TOKEN.fontDisplay,
          fontSize: "clamp(28px, 5.6dvh, 44px)",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: titleColor,
          lineHeight: 1.08,
          marginTop: "clamp(1px, 0.4dvh, 4px)",
        }}
      >
        {draw ? "Égalité" : win ? "Victoire" : "Défaite"}
      </div>
      {topicName && (
        <div
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: "clamp(10px, 1.5dvh, 12.5px)",
            marginTop: "clamp(1px, 0.4dvh, 4px)",
          }}
        >
          {topicName}
        </div>
      )}

      <div
        className="flex w-full min-w-0 items-center justify-center"
        style={{
          gap: "clamp(6px, 1.8vw, 14px)",
          marginTop: "clamp(10px, 2.2dvh, 24px)",
        }}
      >
        <div className="flex min-w-0 flex-1 items-center justify-end">
          <span
            className="truncate"
            style={{
              fontFamily: TOKEN.fontDisplay,
              fontSize: "clamp(26px, 5.5dvh, 42px)",
              fontWeight: 800,
              color: myColor,
              lineHeight: 1,
            }}
          >
            <AnimatedNumber value={scores.you} />
          </span>
        </div>
        <RungedAvatar
          name={playerName}
          avatar={playerAvatar}
          ringColor={myRing}
        />
        <Zap
          size={22}
          fill={TOKEN.duelSurfaceMuted}
          color={TOKEN.duelSurfaceMuted}
          strokeWidth={0}
          className="shrink-0"
        />
        <RungedAvatar
          name={opponentName}
          avatar={opponentAvatar}
          ringColor={theirRing}
        />
        <div className="flex min-w-0 flex-1 items-center justify-start">
          <span
            className="truncate"
            style={{
              fontFamily: TOKEN.fontDisplay,
              fontSize: "clamp(26px, 5.5dvh, 42px)",
              fontWeight: 800,
              color: theirColor,
              lineHeight: 1,
            }}
          >
            <AnimatedNumber value={scores.them} />
          </span>
        </div>
      </div>

      <div
        className="grid w-full max-w-[460px] items-start"
        style={{
          gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
          columnGap: "clamp(6px, 2vw, 14px)",
          marginTop: "clamp(4px, 1dvh, 10px)",
        }}
      >
        <PlayerMeta
          name={playerName}
          title={playerTitle}
          level={playerLevel}
          color={myColor}
        />
        <span
          className="text-center"
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          vs
        </span>
        <PlayerMeta
          name={opponentName}
          title={opponentTitle}
          level={opponentLevel}
          color={theirColor}
        />
      </div>

      <div
        className="grid w-full max-w-[460px]"
        style={{
          gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
          gap: "clamp(4px, 1dvh, 10px)",
          marginTop: "clamp(8px, 1.8dvh, 20px)",
        }}
      >
        <StatBox
          label="SCORE DU MATCH"
          color={TOKEN.gauge}
          value={String(result?.myScore ?? scores.you)}
        />
        <StatBox
          label="BONUS RAPIDITÉ"
          color={TOKEN.correctAccent}
          value={reward == null ? "···" : `+${result?.speedBonus ?? 0}`}
          hint="inclus"
        />
        <StatBox
          label="BONUS VICTOIRE"
          color={TOKEN.timer}
          value={reward == null ? "···" : `+${reward.victoryBonus}`}
        />
        <StatBox
          label="XP TOTALE"
          color={LOSS}
          value={reward == null ? "···" : `${reward.xp}`}
        />
      </div>

      <div
        className="flex min-h-0 w-full justify-center"
        style={{ marginTop: "clamp(6px, 1.4dvh, 16px)" }}
      >
        <LevelRing
          level={result?.progression.level ?? playerLevel}
          progressPercent={result?.progression.levelProgressPercent ?? 0}
          xpTotal={result?.progression.xpTotal ?? 0}
          xpForNextLevel={result?.progression.xpForNextLevel ?? 0}
          xpGained={reward?.xp ?? null}
        />
      </div>

      {statusMessage && (
        <p
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: "clamp(11px, 1.5dvh, 13px)",
            marginTop: "clamp(4px, 1dvh, 10px)",
          }}
        >
          {statusMessage}
        </p>
      )}

      {rematch.incomingRequest && !rematch.declined && (
        <div
          className="w-full max-w-[420px] rounded-2xl border px-4 py-2.5 text-center"
          style={{
            marginTop: "clamp(6px, 1.4dvh, 14px)",
            borderColor: TOKEN.primary,
            background: veil(TOKEN.primary, 14),
          }}
        >
          <p
            style={{
              color: TOKEN.duelSurface,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            {opponentName} te propose une revanche
          </p>
          <div className="mt-2 flex items-center justify-center gap-2.5">
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
        className={`grid w-full max-w-[420px] gap-3 ${
          showRematchCell ? "grid-cols-2" : "grid-cols-1"
        }`}
        style={{ marginTop: "auto", paddingTop: "clamp(8px, 1.8dvh, 18px)" }}
      >
        {showRematchCell &&
          (botGame ? (
            <ActionButton
              icon={<Zap size={16} fill={WHITE} strokeWidth={0} />}
              background={LOSS}
              disabled={replayPending}
              onClick={onReplayBot}
            >
              Rejouer
            </ActionButton>
          ) : outgoingPending ? (
            <div className="flex min-w-0 items-stretch gap-2">
              <div
                className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-[14px] font-bold"
                style={{
                  height: "clamp(42px, 6.2dvh, 54px)",
                  background: LOSS,
                  opacity: 0.55,
                  color: WHITE,
                  fontFamily: TOKEN.fontDisplay,
                  fontSize: "clamp(12px, 1.8dvh, 15px)",
                }}
              >
                <span className="min-w-0 truncate">Revanche envoyée…</span>
              </div>
              <button
                type="button"
                onClick={onRematchCancel}
                disabled={rematchPending.cancel}
                className="qu-btn shrink-0 rounded-[14px] border px-2.5 text-xs font-semibold disabled:opacity-50"
                style={{
                  borderColor: TOKEN.border,
                  background: veil(TOKEN.duelSurface, 6),
                  color: TOKEN.duelSurfaceMuted,
                }}
              >
                Annuler
              </button>
            </div>
          ) : (
            <ActionButton
              icon={<Zap size={16} fill={WHITE} strokeWidth={0} />}
              background={LOSS}
              disabled={rematchDisabled}
              onClick={onRematchRequest}
            >
              Revanche
            </ActionButton>
          ))}

        <ActionButton
          icon={<Users size={16} />}
          background={TOKEN.timer}
          disabled={newOpponentPending}
          onClick={onNewOpponent}
        >
          Nouvel adversaire
        </ActionButton>
      </div>

      <button
        type="button"
        onClick={onOpenReview}
        className="qu-bob flex shrink-0 flex-col items-center gap-0.5"
        style={{
          marginTop: "clamp(4px, 1dvh, 10px)",
          paddingTop: "clamp(4px, 1dvh, 10px)",
        }}
      >
        <span
          style={{
            color: TOKEN.duelSurfaceMuted,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.22em",
          }}
        >
          DETAILS
        </span>
        <ChevronDown size={18} color={TOKEN.duelSurfaceMuted} />
      </button>
    </div>
  )
}
