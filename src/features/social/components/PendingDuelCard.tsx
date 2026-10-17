import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { Clock, DoorOpen, Hourglass, Send, Swords } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
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
import type { PendingDuel } from "../domain/pending-duel"
import { usePendingDuelActions } from "../hooks/usePendingDuelActions"

/** Boutons des actions : pleine largeur en compact, largeur naturelle à partir de la tablette. */
const ACTION_BUTTON = "flex-1 tablet-up:min-w-28 tablet-up:flex-none"

/**
 * Carte **pleine largeur** d'un défi ou d'un salon en attente, composée en trois zones :
 * en-tête (type, sujet, joueur), bandeau d'échéance pleine largeur et pied d'actions séparé.
 * Aucune couleur d'accent par type : la hiérarchie porte seule la lecture, dans la recette
 * plate des cartes.
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

  const kindLabel =
    item.kind === "received"
      ? t("social.pending.received")
      : item.kind === "sent"
        ? t("social.pending.sent")
        : t("social.pending.room")
  const KindIcon =
    item.kind === "received" ? Swords : item.kind === "sent" ? Send : DoorOpen
  const playerLine =
    item.kind === "room" && !item.player
      ? t("social.pending.roomWaiting")
      : t(
          item.kind === "received"
            ? "social.pending.fromPlayer"
            : item.kind === "sent"
              ? "social.pending.toPlayer"
              : "social.pending.withPlayer",
          { name: playerName }
        )

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="items-start gap-4 px-5 pt-5 pb-4">
        <CardMedia className="size-11">
          <TopicIcon topic={item.topic} size={44} />
        </CardMedia>

        <CardHeading>
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex min-w-0 items-center gap-1.5 text-2xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              <KindIcon className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{kindLabel}</span>
            </span>
            {item.kind !== "room" && item.rematch && (
              <Badge variant="secondary" className="shrink-0">
                {t("social.pending.rematch")}
              </Badge>
            )}
          </div>

          <CardTitle className="mt-1.5 truncate font-heading text-base font-bold tracking-tight">
            {resolveName(item.topic.names)}
          </CardTitle>

          <CardDescription className="mt-1.5 flex min-w-0 items-center gap-1.5">
            {item.player ? (
              item.player.userId ? (
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
                    size={20}
                  />
                </Link>
              ) : (
                <UserAvatar
                  name={playerName}
                  avatarOptions={item.player.avatarOptions ?? undefined}
                  size={20}
                />
              )
            ) : (
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                <Hourglass size={11} aria-hidden />
              </span>
            )}
            <span className="truncate">{playerLine}</span>
          </CardDescription>
        </CardHeading>
      </CardHeader>

      <div className="mx-5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-xl bg-surface-muted px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Clock className="size-4 shrink-0" aria-hidden />
          {item.kind === "room"
            ? t("social.pending.expiresIn")
            : t("social.pending.challengeExpiresIn")}
        </span>
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
          className="ml-auto [--countdown-complete:var(--danger)]"
          onComplete={() => {
            void queryClient.invalidateQueries({
              queryKey:
                item.kind === "room"
                  ? queryKeys.rooms.mine()
                  : queryKeys.challenges.mine(),
            })
          }}
        />
      </div>

      <CardFooter className="mt-4 justify-end gap-2 border-t border-border">
        {item.kind === "received" && (
          <>
            {/* Refuser supprime l'invitation côté backend : action destructive. */}
            <Button
              variant="destructive"
              className={ACTION_BUTTON}
              disabled={actions.declinePending}
              onClick={() => void actions.decline(item.id)}
            >
              {t("social.pending.decline")}
            </Button>
            <Button
              className={ACTION_BUTTON}
              disabled={actions.acceptPending}
              onClick={() => void actions.accept(item.id)}
            >
              {t("social.pending.accept")}
            </Button>
          </>
        )}

        {item.kind === "sent" && (
          <Button
            variant="outline"
            className={ACTION_BUTTON}
            disabled={actions.cancelPending}
            onClick={() => actions.cancelChallenge(item.id)}
          >
            {t("social.pending.cancel")}
          </Button>
        )}

        {item.kind === "room" && (
          <>
            <Button
              className={ACTION_BUTTON}
              onClick={() => actions.openRoom(item.id)}
            >
              {t("social.pending.openRoom")}
            </Button>
            {item.canCancel && (
              <Button
                variant="destructive"
                className={ACTION_BUTTON}
                disabled={actions.cancelRoomPending}
                onClick={() => actions.cancelRoom(item.id)}
              >
                {t("social.pending.closeRoom")}
              </Button>
            )}
          </>
        )}
      </CardFooter>
    </Card>
  )
}
