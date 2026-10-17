import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"
import { Check, Equal, X, type LucideIcon } from "lucide-react"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardHeading,
  CardMedia,
  CardTitle,
} from "@/components/ui/card"
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
  WIN: "var(--win)",
  LOSS: "var(--loss)",
  DRAW: "var(--draw)",
  WAITING: "var(--draw)",
  IN_PROGRESS: "var(--draw)",
  CANCELLED: "var(--draw)",
}

/**
 * Pastille d'issue d'un duel terminé : icône **blanche** sur disque plein, aux **couleurs de
 * la barre de ratio V/N/D** (`--win` / `--draw` / `--loss`), à l'image de la coche d'un titre
 * atteint (`TITLE_CARD_ACCENT.acquiredCheck`).
 */
const OUTCOME_BADGE: Partial<
  Record<GameHistoryItem["outcome"], { icon: LucideIcon; background: string }>
> = {
  WIN: { icon: Check, background: "var(--win)" },
  LOSS: { icon: X, background: "var(--loss)" },
  DRAW: { icon: Equal, background: "var(--draw)" },
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

/** Liste de duels — sujet, adversaire et issue en **pastille colorée** à icône blanche pour
 *  les parties terminées (libellé texte pour les autres statuts), score à partir de la
 *  tablette. Chaque carte ouvre directement la page résultat d'une partie terminée (sinon
 *  l'arène). */
export function MatchList({ items }: { items: GameHistoryItem[] }) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item) => {
        const name = opponentName(item, t)
        const accent = OUTCOME_COLOR[item.outcome]
        const outcomeLabel = t(OUTCOME_KEYS[item.outcome])
        const badge = OUTCOME_BADGE[item.outcome]
        const BadgeIcon = badge?.icon

        return (
          <Link
            key={item.gameId}
            to={gameHref(item)}
            aria-label={t("topic.matchList.openAria", { name })}
            className="block rounded-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <Card interactive className="gap-0">
              <CardHeader>
                <CardMedia>
                  <TopicIcon topic={item.topic} size={36} />
                </CardMedia>

                <CardHeading>
                  <CardTitle className="truncate">
                    {resolveName(item.topic.names)}
                  </CardTitle>
                  <CardDescription className="flex min-w-0 items-center gap-1.5">
                    <UserAvatar
                      name={name}
                      userId={item.opponent?.userId}
                      avatarOptions={item.opponent?.avatarOptions ?? undefined}
                      size={18}
                    />
                    <span className="truncate">
                      {t("topic.matchList.against", { name })}
                    </span>
                  </CardDescription>
                </CardHeading>

                <CardAction className="gap-3">
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
                  {badge && BadgeIcon ? (
                    <span
                      role="img"
                      aria-label={outcomeLabel}
                      title={outcomeLabel}
                      className="grid size-9 shrink-0 place-items-center rounded-full text-white"
                      style={{ background: badge.background }}
                    >
                      <BadgeIcon
                        className="size-4 drop-shadow-[0_1px_1px_rgb(0_0_0/0.45)]"
                        strokeWidth={3}
                        aria-hidden
                      />
                    </span>
                  ) : (
                    <div
                      className="text-xs font-semibold tablet-up:w-[82px] tablet-up:text-right"
                      style={{ color: accent }}
                    >
                      {outcomeLabel}
                    </div>
                  )}
                </CardAction>
              </CardHeader>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
