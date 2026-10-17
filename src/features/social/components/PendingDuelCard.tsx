import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardHeading,
  CardMedia,
  CardTitle,
} from "@/components/ui/card"
import { Countdown } from "@/components/arc/countdown/countdown"
import { TopicIcon } from "@/shared/components/topic-icon"
import { UserAvatar } from "@/shared/components/user-avatar"
import { useServerClock } from "@/shared/clock/useServerClock"
import { useTopicName } from "@/features/shell"
import { queryKeys } from "@/lib/query-keys"
import { contextLabel, type PendingDuel } from "../domain/pending-duel"
import { usePendingDuelActions } from "../hooks/usePendingDuelActions"

/** Boutons des actions : pleine largeur en compact, largeur naturelle à partir de la tablette. */
const ACTION_BUTTON = "flex-1 tablet-up:flex-none"

/**
 * Carte **pleine largeur empilée** d'un défi ou d'un salon en attente : sujet + contexte à
 * gauche, compte à rebours et actions à droite (empilés en compact). Le panneau d'actions
 * garde sa largeur naturelle — les libellés ne sont plus rognés par une carte étroite.
 */
export function PendingDuelCard({
  item,
  className,
}: {
  item: PendingDuel
  className?: string
}) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  const queryClient = useQueryClient()
  const { serverNow } = useServerClock()
  const actions = usePendingDuelActions()
  const playerName =
    item.player?.pseudonym ?? t("social.pending.playerFallback")

  return (
    <Card className={cn("gap-0", className)}>
      <CardHeader className="flex-col items-stretch gap-3 tablet-up:flex-row tablet-up:items-center tablet-up:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <CardMedia>
            <TopicIcon topic={item.topic} size={36} />
          </CardMedia>
          <CardHeading>
            <div className="flex min-w-0 items-center gap-2">
              <CardTitle className="truncate">
                {resolveName(item.topic.names)}
              </CardTitle>
              {item.kind !== "room" && item.rematch && (
                <Badge variant="secondary" className="shrink-0">
                  {t("social.pending.rematch")}
                </Badge>
              )}
            </div>
            <CardDescription className="flex min-w-0 items-center gap-1.5">
              {item.player?.userId ? (
                <Link
                  to={`/players/${item.player.userId}`}
                  aria-label={t("social.pending.viewProfile", {
                    name: playerName,
                  })}
                  className="shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <UserAvatar
                    name={playerName}
                    userId={item.player.userId}
                    avatarOptions={item.player.avatarOptions ?? undefined}
                    size={18}
                  />
                </Link>
              ) : (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted">
                  <Clock size={11} aria-hidden />
                </span>
              )}
              <span className="truncate">{contextLabel(item, t)}</span>
            </CardDescription>
          </CardHeading>
        </div>

        <div className="flex flex-col gap-2.5 tablet-up:shrink-0 tablet-up:flex-row tablet-up:items-center tablet-up:gap-3">
          <Countdown
            target={item.expiresAt}
            units={["hours", "minutes", "seconds"]}
            variant="compact"
            size="sm"
            clock={serverNow}
            label={
              item.kind === "room"
                ? t("social.pending.expiresIn")
                : t("social.pending.challengeExpiresIn")
            }
            completeLabel={t("social.pending.expired")}
            className="[--countdown-complete:var(--danger)]"
            onComplete={() => {
              void queryClient.invalidateQueries({
                queryKey:
                  item.kind === "room"
                    ? queryKeys.rooms.mine()
                    : queryKeys.challenges.mine(),
              })
            }}
          />

          {item.kind === "received" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                className={ACTION_BUTTON}
                disabled={actions.declinePending}
                onClick={() => void actions.decline(item.id)}
              >
                {t("social.pending.decline")}
              </Button>
              <Button
                size="sm"
                className={ACTION_BUTTON}
                disabled={actions.acceptPending}
                onClick={() => void actions.accept(item.id)}
              >
                {t("social.pending.accept")}
              </Button>
            </div>
          )}

          {item.kind === "sent" && (
            <Button
              size="sm"
              variant="destructive"
              className={ACTION_BUTTON}
              disabled={actions.cancelPending}
              onClick={() => actions.cancelChallenge(item.id)}
            >
              {t("social.pending.cancel")}
            </Button>
          )}

          {item.kind === "room" && (
            <div className="flex gap-2">
              <Button
                size="sm"
                className={ACTION_BUTTON}
                onClick={() => actions.openRoom(item.id)}
              >
                {t("social.pending.openRoom")}
              </Button>
              {item.canCancel && (
                <Button
                  size="sm"
                  variant="destructive"
                  className={ACTION_BUTTON}
                  disabled={actions.cancelRoomPending}
                  onClick={() => actions.cancelRoom(item.id)}
                >
                  {t("social.pending.cancel")}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
    </Card>
  )
}
