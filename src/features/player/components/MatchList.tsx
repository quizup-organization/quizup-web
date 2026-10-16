import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { Card, CardContent } from "@/components/ui/card"
import { TopicIcon } from "@/shared/components/topic-icon"
import { UserAvatar } from "@/shared/components/user-avatar"
import type { TranslationKey } from "@/lib/i18n/types"
import {
  isFinishedOutcome,
  type GameHistoryItem,
} from "@/features/player/domain/history"
import { useTopicName } from "@/features/shell"

const OUTCOME_KEYS: Record<GameHistoryItem["outcome"], TranslationKey> = {
  WIN: "topic.matchList.outcomes.win",
  LOSS: "topic.matchList.outcomes.loss",
  DRAW: "topic.matchList.outcomes.draw",
  WAITING: "topic.matchList.outcomes.waiting",
  IN_PROGRESS: "topic.matchList.outcomes.inProgress",
  CANCELLED: "topic.matchList.outcomes.cancelled",
}

const OUTCOME_COLOR: Record<GameHistoryItem["outcome"], string> = {
  WIN: "var(--duel-correct-accent)",
  LOSS: "var(--duel-wrong-accent)",
  DRAW: "var(--duel-score)",
  WAITING: "var(--duel-score)",
  IN_PROGRESS: "var(--duel-score)",
  CANCELLED: "var(--duel-score)",
}

function opponentName(item: GameHistoryItem, t: TFunction): string {
  if (item.opponent?.pseudonym) return item.opponent.pseudonym
  return item.opponentType === "BOT"
    ? t("topic.matchList.bot")
    : t("topic.matchList.opponent")
}

/** Partie terminée : lien direct vers la page résultat (pas de chargement d'arène). */
function gameHref(item: GameHistoryItem): string {
  return isFinishedOutcome(item.outcome)
    ? `/game/${item.gameId}/result`
    : `/game/${item.gameId}`
}

/** Liste de duels — sujet, adversaire et issue colorée (+ score des parties terminées à partir
 *  de la tablette). Chaque carte ouvre directement la page résultat d'une partie terminée
 *  (sinon l'arène). */
export function MatchList({ items }: { items: GameHistoryItem[] }) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        const name = opponentName(item, t)
        const accent = OUTCOME_COLOR[item.outcome]

        return (
          <Link
            key={item.gameId}
            to={gameHref(item)}
            aria-label={t("topic.matchList.openAria", { name })}
            className="block rounded-4xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Card
              size="sm"
              className="cursor-pointer gap-0 py-3 transition-[color,border-color] hover:border-foreground/25 tablet-up:py-4"
            >
              <CardContent className="flex items-center gap-3 px-3 tablet-up:gap-4 tablet-up:px-4">
                <TopicIcon topic={item.topic} size={38} />

                <div className="min-w-0 flex-1 tablet-up:w-[170px] tablet-up:flex-none">
                  <div className="truncate text-sm font-semibold">
                    {resolveName(item.topic.names)}
                  </div>
                  <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground tablet-up:hidden">
                    <UserAvatar
                      name={name}
                      userId={item.opponent?.userId}
                      avatarOptions={item.opponent?.avatarOptions ?? undefined}
                      size={18}
                    />
                    <span className="truncate">
                      {t("topic.matchList.against", { name })}
                    </span>
                  </div>
                </div>

                <div className="hidden min-w-0 flex-1 items-center gap-2.5 tablet-up:flex">
                  <UserAvatar
                    name={name}
                    userId={item.opponent?.userId}
                    avatarOptions={item.opponent?.avatarOptions ?? undefined}
                    size={28}
                  />
                  <span className="truncate text-xs text-muted-foreground">
                    {t("topic.matchList.against", { name })}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  {/* Score : uniquement les parties au bilan définitif, à partir de la tablette. */}
                  {isFinishedOutcome(item.outcome) && (
                    <div className="hidden items-center gap-1 font-heading text-base font-bold tablet-up:flex">
                      <span style={{ color: accent }}>{item.myScore}</span>
                      <span className="text-xs text-muted-foreground">—</span>
                      <span className="text-muted-foreground">
                        {item.opponentScore}
                      </span>
                    </div>
                  )}
                  <div
                    className="text-xs font-semibold tablet-up:w-[82px] tablet-up:text-right"
                    style={{ color: accent }}
                  >
                    {OUTCOME_KEYS[item.outcome]
                      ? t(OUTCOME_KEYS[item.outcome])
                      : "—"}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
