import { Swords } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { AppDialog } from "@/shared/components/app-dialog"
import { usePlayerProfile } from "@/features/player"
import { useTopicOverview } from "@/features/topic-detail"
import { useTopicName } from "@/features/shell"
import { useNotificationStore } from "../stores/useNotificationStore"
import { useChallengeInvitationActions } from "../hooks/useChallengeInvitationActions"

/**
 * Modale d'invitation live : affichée dès qu'un défi nominatif arrive par
 * `/topic/notifications/{userId}`. Accepter rejoint le salon ; refuser le décline.
 * **Modale centrée à réponse obligatoire** (mobile comme desktop) : ni croix, ni clic
 * extérieur, ni Échap — seule une réponse ferme l'invitation.
 */
export function ChallengeInvitationDialog() {
  const { t } = useTranslation()
  // Invitation ré-affichée depuis l'inbox prioritaire sur la file live ; l'invitation retirée
  // reste rendue le temps de l'animation de sortie (sinon le dialog serait démonté avant la fin).
  const liveInvitation = useNotificationStore((s) => s.invitations[0])
  const selectedInvitation = useNotificationStore((s) => s.selectedInvitation)
  const invitation = selectedInvitation ?? liveInvitation
  const lastInvitation = useNotificationStore((s) => s.lastInvitation)
  const actions = useChallengeInvitationActions()
  const current = invitation ?? lastInvitation
  const player = usePlayerProfile(current?.actorId ?? "")
  const topic = useTopicOverview(current?.topicId ?? "")
  const resolveName = useTopicName()

  if (!current) {
    return null
  }

  const name =
    player.data?.pseudonym ?? t("notifications.invitation.playerFallback")
  const topicLabel = topic.data
    ? resolveName(
        topic.data.topic.names,
        t("notifications.invitation.topicFallback")
      )
    : t("notifications.invitation.topicFallback")

  return (
    <AppDialog
      open={!!invitation}
      onClose={() => undefined}
      title={t(
        current.gameId
          ? "notifications.invitation.rematchTitle"
          : "notifications.invitation.title"
      )}
      showCloseButton={false}
      dismissible={false}
      footerClassName="compact:flex-row compact:items-center"
      footer={
        <>
          {/* Refuser supprime l'invitation côté backend : action destructive. */}
          <Button
            variant="destructive"
            disabled={actions.pending}
            onClick={() => void actions.refuse(current)}
          >
            {t("notifications.actions.refuse")}
          </Button>
          <Button
            disabled={actions.pending}
            onClick={() => void actions.accept(current)}
          >
            {t("notifications.actions.accept")}
          </Button>
        </>
      }
    >
      <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <Swords className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <span>
          <span className="font-medium text-foreground">{name}</span>{" "}
          {t(
            current.gameId
              ? "notifications.invitation.rematchOn"
              : "notifications.invitation.challengesOn"
          )}{" "}
          <span className="font-medium text-foreground">{topicLabel}</span>.
        </span>
      </p>
    </AppDialog>
  )
}
