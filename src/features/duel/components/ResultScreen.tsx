import { useRef, type ReactNode, type TouchEvent } from "react"
import { Link } from "react-router-dom"
import { ChevronDown, Users, Zap } from "lucide-react"
import { AnimatedNumber } from "@/shared/components/animated-number"
import { CloseButton } from "@/shared/components/close-button"
import {
  UserAvatar,
  type AvatarIdentity,
} from "@/shared/components/user-avatar"
import { TOKEN, veil } from "@/shared/theme/tokens"
import type { GameResultView } from "../domain/game-dto"
import { Confetti } from "./Confetti"
import { DuelPattern } from "./DuelPattern"
import { LevelRing } from "./LevelRing"

interface ResultScreenProps {
  playerName: string
  opponentName: string
  playerAvatar?: AvatarIdentity
  opponentAvatar?: AvatarIdentity
  /** Niveau/titre figés à l'instant de la partie (snapshot serveur). */
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
  botGame: boolean
  /** Revanche : crée un défi nominatif vers l'adversaire (flux défi existant). */
  onChallengeRematch: () => void
  rematchPending: boolean
  onOpenReview: () => void
  /** Faux si aucune question n'est à revoir (ex. abandon avant tout round) → pas de DETAILS. */
  canReview?: boolean
  onNewOpponent: () => void
  onReplayBot: () => void
  newOpponentPending?: boolean
  replayPending?: boolean
  onExit: () => void
}

/** Seuil (px) de glissement vertical vers le haut pour ouvrir la revue. */
const PULL_UP_THRESHOLD = 48

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

/** Avatar agrandi, cerclé par l'issue du duel, avec halo doux. Cliquable vers la fiche du joueur. */
function RungedAvatar({ name, avatar, ringColor }: RungedAvatarProps) {
  const frame = (
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

  const userId = avatar?.userId
  if (!userId) return frame

  return (
    <Link
      to={`/players/${userId}`}
      aria-label={`Voir le profil de ${name}`}
      className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {frame}
    </Link>
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
 * scroll) : issue colorée, bilan sportif, donut de niveau, rejeu/revanche et chevron DETAILS
 * vers la revue des questions. La **revanche** crée un défi nominatif (flux défi/lobby) ; la
 * revue s'ouvre en **glissant vers le haut** (tactile) ou via le bouton DETAILS.
 * Sur desktop, le contenu se répartit en **deux colonnes** (issue/scores/joueurs/actions à
 * gauche, stats/anneau à droite) pour ne pas laisser un vide central sur grand écran.
 * Sortie par l'icône X en haut à droite.
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
  botGame,
  onChallengeRematch,
  rematchPending,
  onOpenReview,
  canReview = true,
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

  // Glissement vers le haut (mobile) → ouvre la revue des questions.
  const pullStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (event: TouchEvent) => {
    const touch = event.touches[0]
    pullStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }
  const onTouchEnd = (event: TouchEvent) => {
    const start = pullStart.current
    pullStart.current = null
    const touch = event.changedTouches[0]
    if (!start || !touch) return
    const dy = touch.clientY - start.y
    const dx = touch.clientX - start.x
    if (canReview && dy <= -PULL_UP_THRESHOLD && Math.abs(dy) > Math.abs(dx)) {
      onOpenReview()
    }
  }

  return (
    <div
      className="qu-pop qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{
        background: TOKEN.duelBg,
        color: TOKEN.duelSurface,
        padding: "clamp(10px, 2.2dvh, 22px) clamp(12px, 4vw, 22px)",
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <DuelPattern />
      {/* Mobile : pile `justify-around` d'origine. Desktop (R2) : deux colonnes — issue,
          scores, joueurs et actions à gauche ; stats et anneau de niveau à droite — pour
          occuper réellement l'écran au lieu d'un ruban centré dans un océan de vide. */}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-around desktop:mx-auto desktop:grid desktop:max-w-[1080px] desktop:grid-cols-2 desktop:content-center desktop:items-center desktop:gap-x-16 desktop:gap-y-8">
        <div className="contents desktop:col-start-1 desktop:flex desktop:flex-col desktop:items-center desktop:justify-center desktop:gap-7">
          {win && <Confetti />}

          <CloseButton
            onClick={onExit}
            aria-label="Quitter les résultats"
            className="absolute z-40"
            style={{
              top: "calc(env(safe-area-inset-top) + clamp(4px, 1dvh, 10px))",
              right: "clamp(8px, 2.5vw, 16px)",
            }}
          />

          <div className="flex flex-col items-center">
            <div
              style={{
                color: titleColor,
                fontSize: "clamp(10px, 1.5dvh, 12px)",
                fontWeight: 700,
                letterSpacing: "0.18em",
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
          </div>

          <div
            className="flex w-full min-w-0 items-center justify-center desktop:max-w-[420px]"
            style={{ gap: "clamp(6px, 1.8vw, 14px)" }}
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
        </div>

        <div className="contents desktop:col-start-2 desktop:row-span-2 desktop:flex desktop:flex-col desktop:items-center desktop:justify-center desktop:gap-10">
          <div
            className="grid w-full max-w-[460px] grid-cols-4 desktop:max-w-[420px] desktop:grid-cols-2"
            style={{
              gap: "clamp(4px, 1dvh, 10px)",
            }}
          >
            <StatBox
              label="SCORE DU MATCH"
              color={TOKEN.gauge}
              value={String(result?.basePoints ?? scores.you)}
            />
            <StatBox
              label="BONUS RAPIDITÉ"
              color={TOKEN.correctAccent}
              value={reward == null ? "···" : `+${result?.speedBonus ?? 0}`}
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

          <div className="flex min-h-0 w-full justify-center">
            <LevelRing
              level={result?.progression.level ?? playerLevel}
              progressPercent={result?.progression.levelProgressPercent ?? 0}
              xpTotal={result?.progression.xpTotal ?? 0}
              xpForNextLevel={result?.progression.xpForNextLevel ?? 0}
              xpGained={reward?.xp ?? null}
            />
          </div>
        </div>

        <div className="contents desktop:col-start-1 desktop:flex desktop:flex-col desktop:items-center desktop:justify-center desktop:gap-4">
          <div
            className={`grid w-full max-w-[420px] gap-3 ${
              botGame ? "grid-cols-1" : "grid-cols-2"
            }`}
          >
            {botGame && (
              <ActionButton
                icon={<Zap size={16} fill={WHITE} strokeWidth={0} />}
                background={LOSS}
                disabled={replayPending}
                onClick={onReplayBot}
              >
                Rejouer
              </ActionButton>
            )}

            {!botGame && (
              <ActionButton
                icon={<Zap size={16} fill={WHITE} strokeWidth={0} />}
                background={LOSS}
                disabled={rematchPending}
                onClick={onChallengeRematch}
              >
                Revanche
              </ActionButton>
            )}

            <ActionButton
              icon={<Users size={16} />}
              background={TOKEN.timer}
              disabled={newOpponentPending}
              onClick={onNewOpponent}
            >
              Nouvel adversaire
            </ActionButton>
          </div>

          {canReview && (
            <button
              type="button"
              onClick={onOpenReview}
              className="flex shrink-0 flex-col items-center gap-1"
              aria-label="Ouvrir la revue des questions"
              style={{ paddingTop: "clamp(2px, 0.6dvh, 6px)", paddingBottom: 4 }}
            >
              <span
                className="qu-bob"
                style={{
                  width: 42,
                  height: 4,
                  borderRadius: 999,
                  background: TOKEN.duelSurfaceMuted,
                  opacity: 0.5,
                }}
                aria-hidden
              />
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
          )}
        </div>
      </div>
    </div>
  )
}
