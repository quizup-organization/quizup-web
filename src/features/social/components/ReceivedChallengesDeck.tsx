import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CardStack } from "@/components/arc/card-stack/card-stack"
import { Countdown } from "@/components/arc/countdown/countdown"
import { TopicIcon } from "@/shared/components/topic-icon"
import { UserAvatar } from "@/shared/components/user-avatar"
import { useServerClock } from "@/shared/clock/useServerClock"
import { useTopicName } from "@/features/shell"
import { contextLabel, type ReceivedDuel } from "../domain/pending-duel"
import { usePendingDuelActions } from "../hooks/usePendingDuelActions"

/** Carte plus basse que le défaut du deck (notre contenu est compact) et pile un peu plus large. */
const DECK_STYLE = {
  "--card-height": "12.5rem",
  "--stack-width": "22rem",
} as CSSProperties

/**
 * **Deck de tri des invitations reçues** (Arc `card-stack`) : une carte à la fois, glisser à
 * gauche pour refuser, à droite pour accepter (ou boutons/flèches). Pas d'Undo : les décisions
 * sont des commandes serveur définitives.
 *
 * La pile **indexe ses cartes par position** : la liste reçue doit rester stable pendant la
 * session (une suppression optimiste ferait sauter des cartes). On travaille donc sur un instantané,
 * complété par les nouvelles invitations (ajoutées sous la pile).
 */
export function ReceivedChallengesDeck({ items }: { items: ReceivedDuel[] }) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  const { serverNow } = useServerClock()
  const actions = usePendingDuelActions()

  const [snapshot, setSnapshot] = useState(items)
  const known = useRef(new Set(items.map((item) => item.id)))
  useEffect(() => {
    const incoming = items.filter((item) => !known.current.has(item.id))
    if (incoming.length === 0) return
    for (const item of incoming) known.current.add(item.id)
    setSnapshot((current) => [...current, ...incoming])
  }, [items])

  return (
    <CardStack
      items={snapshot}
      getKey={(item) => item.id}
      getLabel={(item) => resolveName(item.topic.names)}
      label={t("social.challenges.deckAria")}
      labels={{
        left: t("social.pending.decline"),
        right: t("social.pending.accept"),
      }}
      outcomes={{
        left: t("social.pending.declinedOutcome"),
        right: t("social.pending.acceptedOutcome"),
      }}
      tones={{ left: "destructive" }}
      style={DECK_STYLE}
      onDecide={(item, decision) => {
        if (decision === "right") void actions.accept(item.id)
        else void actions.decline(item.id)
      }}
      renderCard={(item) => (
        <div className="flex h-full flex-col gap-3 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <TopicIcon topic={item.topic} size={44} />
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-base font-semibold">
                  {resolveName(item.topic.names)}
                </span>
                {item.rematch && (
                  <Badge variant="secondary" className="shrink-0">
                    {t("social.pending.rematch")}
                  </Badge>
                )}
              </div>
              <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <UserAvatar
                  name={
                    item.player?.pseudonym ?? t("social.pending.playerFallback")
                  }
                  userId={item.player?.userId}
                  avatarOptions={item.player?.avatarOptions ?? undefined}
                  size={18}
                />
                <span className="truncate">{contextLabel(item, t)}</span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <Countdown
              target={item.expiresAt}
              units={["hours", "minutes", "seconds"]}
              variant="compact"
              size="sm"
              fullWidth
              clock={serverNow}
              label={t("social.pending.challengeExpiresIn")}
              completeLabel={t("social.pending.expired")}
              className="[--countdown-complete:var(--danger)]"
            />
          </div>
        </div>
      )}
      renderEmpty={() => (
        <div className="flex flex-col items-center gap-2">
          <span className="grid size-10 place-items-center rounded-full bg-success-600/15 text-success-600">
            <Check className="size-5" aria-hidden />
          </span>
          <p className="text-base font-semibold">
            {t("social.challenges.deckDoneTitle")}
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("social.challenges.deckDoneDescription")}
          </p>
        </div>
      )}
    />
  )
}
