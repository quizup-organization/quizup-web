import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { CloseButton } from "@/shared/components/close-button"
import type { AvatarIdentity } from "@/shared/components/user-avatar"
import { TOKEN } from "@/shared/theme/tokens"
import type { GameResultView } from "../../domain/game-dto"
import { usePullUpReview } from "../../hooks/usePullUpReview"
import { Confetti } from "../Confetti"
import { LevelRing } from "../LevelRing"
import { OutcomeHeader } from "./OutcomeHeader"
import { RESULT_LOSS, RESULT_WHITE } from "./palette"
import { PlayerMeta } from "./PlayerMeta"
import { ResultActions } from "./ResultActions"
import { ScoreBoard } from "./ScoreBoard"
import { StatBoxes } from "./StatBoxes"

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
  /** Feu vert du reveal de la récompense (ouverture terminée + son du bilan joué) — `LevelRing`. */
  revealReady: boolean
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
 * scroll) : issue colorée, bilan sportif, donut de niveau, rejeu/revanche et accès à la revue
 * (cf. `result/` pour les blocs — en-tête d'issue, ligne de score, boîtes de bilan, actions).
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
  revealReady,
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

          <OutcomeHeader
            win={win}
            draw={draw}
            titleColor={titleColor}
            topicName={topicName}
            forfeitLabel={forfeitLabel}
          />

          <ScoreBoard
            playerName={playerName}
            opponentName={opponentName}
            playerAvatar={playerAvatar}
            opponentAvatar={opponentAvatar}
            playerColor={myColor}
            opponentColor={theirColor}
            scores={scores}
          />

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

          <StatBoxes result={result} reward={reward} yourScore={scores.you} />

          <div className="flex min-h-0 w-full justify-center">
            <LevelRing
              level={result?.progression.level ?? playerLevel}
              xpTotal={result?.progression.xpTotal ?? 0}
              xpForNextLevel={result?.progression.xpForNextLevel ?? 0}
              xpGained={reward?.xp ?? null}
              revealStarted={revealReady}
            />
          </div>

          <ResultActions
            botGame={botGame}
            onReplayBot={onReplayBot}
            onChallengeRematch={onChallengeRematch}
            onNewOpponent={onNewOpponent}
            replayPending={replayPending}
            rematchPending={rematchPending}
            rematchRefused={rematchRefused}
            newOpponentPending={newOpponentPending}
            showDetails={showDetails}
            onOpenReview={onOpenReview}
          />
        </div>

        {reviewPane && (
          <div className="hidden min-h-0 w-full desktop:flex">{reviewPane}</div>
        )}
      </div>
    </div>
  )
}
