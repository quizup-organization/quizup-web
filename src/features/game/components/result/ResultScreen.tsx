import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, LogOut, Users, Zap } from "lucide-react"
import { AnimatedNumber } from "@/shared/components/animated-number"
import { CloseButton } from "@/shared/components/close-button"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import type { GameResultView } from "../../domain/game-dto"
import { usePullUpReview } from "../../hooks/usePullUpReview"
import { Confetti } from "../Confetti"
import { LevelRing } from "../LevelRing"
import { ActionButton } from "./ActionButton"
import { RESULT_LOSS, RESULT_WHITE } from "./palette"
import { PlayerMeta } from "./PlayerMeta"
import { RungedAvatar } from "./RungedAvatar"
import { StatBox } from "./StatBox"

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
  /** Forfait : `opponent` = l'adversaire a abandonné, `you` = le joueur a abandonné. */
  forfeit?: "you" | "opponent" | null
  topicName: string
  /** Bilan BFF (`reward` arrive après projection) ; `null` tant que la vue n'a pas répondu. */
  result: GameResultView | null
  botGame: boolean
  /** Revanche : crée un défi nominatif vers l'adversaire (flux défi existant). */
  onChallengeRematch: () => void
  rematchPending: boolean
  /** Défi de revanche refusé/expiré : le bouton reste désactivé et affiche l'issue. */
  rematchRefused?: boolean
  onOpenReview: () => void
  /** Faux si aucune question n'est à revoir (ex. abandon avant tout round) → pas de DETAILS. */
  canReview?: boolean
  /** Panneau de droite (carousel de revue) en desktop ; absent = pile seule centrée
   *  (tactile ou aucune question à revoir). */
  reviewPane?: ReactNode
  onNewOpponent: () => void
  onReplayBot: () => void
  newOpponentPending?: boolean
  replayPending?: boolean
  onExit: () => void
}

/**
 * Écran de résultat du duel (maquette sombre Duolingo-like, tient dans le viewport sans
 * scroll) : issue colorée, bilan sportif, donut de niveau, rejeu/revanche et accès à la revue.
 * <p>
 * La pile reproduit le rendu mobile à tous les breakpoints (largeur bornée, avatars alignés sur
 * les colonnes de noms) et reste la **colonne gauche** en desktop. Sur desktop, `reviewPane`
 * (carousel de questions) occupe la colonne droite ; en tactile, le chevron DETAILS ouvre la
 * bottom sheet de revue. Sortie par l'icône X en haut à droite.
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
  forfeit = null,
  topicName,
  result,
  botGame,
  onChallengeRematch,
  rematchPending,
  rematchRefused = false,
  onOpenReview,
  canReview = true,
  reviewPane,
  onNewOpponent,
  onReplayBot,
  newOpponentPending,
  replayPending,
  onExit,
}: ResultScreenProps) {
  const { t } = useTranslation()
  const win = outcome ? outcome === "win" : scores.you > scores.them
  const draw = outcome ? outcome === "draw" : scores.you === scores.them

  const titleColor = draw ? TOKEN.gauge : win ? TOKEN.timer : RESULT_LOSS
  const myColor = draw ? RESULT_WHITE : win ? TOKEN.correctAccent : RESULT_LOSS
  const theirColor = draw
    ? RESULT_WHITE
    : win
      ? RESULT_LOSS
      : TOKEN.correctAccent
  const myRing = draw ? RESULT_WHITE : myColor
  const theirRing = draw ? RESULT_WHITE : theirColor

  const reward = result?.reward ?? null

  // Forfait : l'issue seule (Victoire/Défaite) ne dit pas pourquoi — on explicite qui a quitté
  // la partie (l'adversaire pour le vainqueur, le joueur lui-même pour le forfait).
  const forfeitLabel =
    forfeit === "you"
      ? t("game.result.forfeitYou")
      : forfeit === "opponent"
        ? t("game.result.forfeitOpponent")
        : null

  const showDetails = canReview && !reviewPane
  const { onTouchStart, onTouchEnd } = usePullUpReview({
    enabled: showDetails,
    onPull: onOpenReview,
  })

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
      {/* Mobile : pile bornée et centrée (mêmes proportions qu'un téléphone). Desktop : deux
          colonnes strictement 50/50 (gouttière centrale) — pile aérée à gauche, carousel de
          revue à droite — et contenu étiré pour ne laisser aucun vide ; sans questions à
          revoir (pas de `reviewPane`), la pile reste seule, centrée. */}
      <div
        className={`flex min-h-0 w-full flex-1 flex-col items-center ${
          reviewPane
            ? "desktop:mx-auto desktop:grid desktop:max-w-[1120px] desktop:grid-cols-2 desktop:items-stretch desktop:gap-x-12 desktop:gap-y-8 desktop:px-4"
            : "desktop:mx-auto desktop:max-w-[520px]"
        }`}
      >
        <div className="mx-auto flex min-h-0 w-full max-w-[520px] flex-1 flex-col items-center justify-around">
          {win && <Confetti />}

          <CloseButton
            onClick={onExit}
            aria-label={t("game.result.quitAria")}
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
              {t("game.result.end")}
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
              {draw
                ? t("game.result.draw")
                : win
                  ? t("game.result.victory")
                  : t("game.result.defeat")}
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
            {forfeitLabel && (
              <div
                className="flex items-center gap-1.5"
                style={{
                  color: TOKEN.gauge,
                  fontSize: "clamp(11px, 1.6dvh, 13px)",
                  fontWeight: 600,
                  marginTop: "clamp(3px, 0.8dvh, 6px)",
                }}
              >
                <LogOut size={13} aria-hidden />
                {forfeitLabel}
              </div>
            )}
          </div>

          {/* Ordre de la maquette : avatar — score ⚡ score — avatar (avatars aux extrémités,
              alignés sur les colonnes de noms justes en dessous). */}
          <div
            className="flex w-full min-w-0 items-center justify-center"
            style={{ gap: "clamp(6px, 1.8vw, 14px)" }}
          >
            <RungedAvatar
              name={playerName}
              avatar={playerAvatar}
              ringColor={myRing}
            />
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
            <Zap
              size={22}
              fill={TOKEN.duelSurfaceMuted}
              color={TOKEN.duelSurfaceMuted}
              strokeWidth={0}
              className="shrink-0"
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
            <RungedAvatar
              name={opponentName}
              avatar={opponentAvatar}
              ringColor={theirRing}
            />
          </div>

          <div
            className="grid w-full items-start"
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
              {t("game.result.vs")}
            </span>
            <PlayerMeta
              name={opponentName}
              title={opponentTitle}
              level={opponentLevel}
              color={theirColor}
            />
          </div>

          <div
            className="grid w-full grid-cols-4"
            style={{
              gap: "clamp(4px, 1dvh, 10px)",
            }}
          >
            <StatBox
              label={t("game.result.score")}
              color={TOKEN.gauge}
              value={String(result?.basePoints ?? scores.you)}
            />
            <StatBox
              label={t("game.result.speedBonus")}
              color={TOKEN.correctAccent}
              value={reward == null ? "···" : `+${result?.speedBonus ?? 0}`}
            />
            <StatBox
              label={t("game.result.victoryBonus")}
              color={TOKEN.timer}
              value={reward == null ? "···" : `+${reward.victoryBonus}`}
            />
            <StatBox
              label={t("game.result.xpTotal")}
              color={RESULT_LOSS}
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

          <div
            className={`grid w-full max-w-[420px] gap-3 ${
              botGame ? "grid-cols-1" : "grid-cols-1 tablet-up:grid-cols-2"
            }`}
          >
            {botGame && (
              <ActionButton
                icon={<Zap size={16} fill={RESULT_WHITE} strokeWidth={0} />}
                background={RESULT_LOSS}
                disabled={replayPending}
                onClick={onReplayBot}
              >
                {t("game.result.replay")}
              </ActionButton>
            )}

            {!botGame && (
              <ActionButton
                icon={<Zap size={16} fill={RESULT_WHITE} strokeWidth={0} />}
                background={
                  rematchRefused ? TOKEN.duelSurfaceMuted : RESULT_LOSS
                }
                disabled={rematchPending || rematchRefused}
                onClick={onChallengeRematch}
              >
                {rematchRefused
                  ? t("game.result.rematchRefused")
                  : rematchPending
                    ? t("game.result.rematchPending")
                    : t("game.result.rematch")}
              </ActionButton>
            )}

            <ActionButton
              icon={<Users size={16} />}
              background={TOKEN.timer}
              disabled={newOpponentPending}
              onClick={onNewOpponent}
            >
              {t("game.result.newOpponent")}
            </ActionButton>
          </div>

          {showDetails && (
            <button
              type="button"
              onClick={onOpenReview}
              className="flex shrink-0 flex-col items-center gap-1"
              aria-label={t("game.result.openReviewAria")}
              style={{
                paddingTop: "clamp(2px, 0.6dvh, 6px)",
                paddingBottom: 4,
              }}
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
                {t("game.result.details")}
              </span>
              <ChevronDown size={18} color={TOKEN.duelSurfaceMuted} />
            </button>
          )}
        </div>

        {reviewPane && (
          <div className="hidden min-h-0 w-full desktop:flex">{reviewPane}</div>
        )}
      </div>
    </div>
  )
}
