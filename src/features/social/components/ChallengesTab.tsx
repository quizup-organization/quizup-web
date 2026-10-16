import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Swords } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { useServerClock } from "@/shared/clock/useServerClock"
import {
  nearestDeadline,
  useCountdownTicks,
} from "@/shared/hooks/useCountdownTicks"
import { useSocialPending } from "../hooks/useSocialPending"
import { PendingDuelList } from "./PendingDuelList"
import { ReceivedChallengesDeck } from "./ReceivedChallengesDeck"

/**
 * Onglet « Défis » : invitations **reçues** en deck de tri (une carte à la fois) et défis
 * **envoyés** en liste empilée. Une seule source de tic-tac par écran : l'échéance la plus
 * proche des deux groupes.
 */
export function ChallengesTab() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { received, sent, isLoading } = useSocialPending()
  const { serverNow } = useServerClock()

  const nextDeadline = useMemo(
    () => nearestDeadline([...received, ...sent].map((item) => item.expiresAt)),
    [received, sent]
  )
  useCountdownTicks({ deadlineAt: nextDeadline, clock: serverNow })

  if (isLoading && received.length === 0 && sent.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{t("common.app.loading")}</p>
    )
  }

  if (received.length === 0 && sent.length === 0) {
    return (
      <EmptyState
        icon={<Swords className="size-6 text-muted-foreground" />}
        title={t("social.challenges.emptyReceived")}
        description={t("social.challenges.emptyReceivedDescription")}
      >
        <Button variant="outline" onClick={() => void navigate("/topics")}>
          {t("social.exploreTopics")}
        </Button>
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-8 compact:gap-6">
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("social.challenges.receivedGroup", { count: received.length })}
        </h3>
        {received.length > 0 ? (
          <ReceivedChallengesDeck items={received} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("social.challenges.emptyReceived")}
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {t("social.challenges.sentGroup", { count: sent.length })}
        </h3>
        {sent.length > 0 ? (
          <PendingDuelList items={sent} />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("social.challenges.emptySent")}
          </p>
        )}
      </section>
    </div>
  )
}
