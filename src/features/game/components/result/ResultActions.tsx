import { useTranslation } from "react-i18next"
import { ChevronDown, Users, Zap } from "lucide-react"
import { TOKEN } from "@/shared/theme/tokens"
import { ActionButton } from "./ActionButton"
import { RESULT_LOSS, RESULT_WHITE } from "./palette"

interface ResultActionsProps {
  botGame: boolean
  onReplayBot: () => void
  onChallengeRematch: () => void
  onNewOpponent: () => void
  replayPending?: boolean
  rematchPending: boolean
  /** Défi de revanche refusé/expiré : le bouton reste désactivé et affiche l'issue. */
  rematchRefused: boolean
  newOpponentPending?: boolean
  /** Chevron DETAILS (tactile, questions à revoir) : ouvre la revue. */
  showDetails: boolean
  onOpenReview: () => void
}

/**
 * Actions de fin de partie : Rejouer (bot) ou Revanche (défi nominatif), Nouvel adversaire —
 * empilées en compact, côte à côte à partir de la tablette. Le chevron DETAILS (tactile)
 * ouvre la revue des questions.
 */
export function ResultActions({
  botGame,
  onReplayBot,
  onChallengeRematch,
  onNewOpponent,
  replayPending,
  rematchPending,
  rematchRefused,
  newOpponentPending,
  showDetails,
  onOpenReview,
}: ResultActionsProps) {
  const { t } = useTranslation()
  return (
    <>
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
            background={rematchRefused ? TOKEN.duelSurfaceMuted : RESULT_LOSS}
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
    </>
  )
}
