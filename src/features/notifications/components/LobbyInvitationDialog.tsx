import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppDialog } from "@/shared/components/app-dialog";
import { usePlayerProfile } from "@/features/player";
import { useTopicOverview } from "@/features/topic";
import { useTopicName } from "@/features/shell";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useLobbyInvitationActions } from "../hooks/useLobbyInvitationActions";

/**
 * Modale d'invitation live : affichée dès qu'un défi nominatif arrive par
 * `/topic/notifications/{userId}`. Accepter rejoint le salon ; refuser le décline.
 * Bottom sheet en tactile, dialog centré sur desktop.
 */
export function LobbyInvitationDialog() {
  const invitation = useNotificationStore((s) => s.invitations[0]);
  // La dernière invitation retirée reste rendue le temps de l'animation de sortie : sinon le
  // dialog serait démonté avant la fin de l'animation de la bottom sheet.
  const lastInvitation = useNotificationStore((s) => s.lastInvitation);
  const actions = useLobbyInvitationActions();
  const current = invitation ?? lastInvitation;
  const player = usePlayerProfile(current?.actorId ?? "");
  const topic = useTopicOverview(current?.topicId ?? "");
  const resolveName = useTopicName();

  if (!current) {
    return null;
  }

  const name = player.data?.pseudonym ?? "Un joueur";
  const topicLabel = topic.data ? resolveName(topic.data.topic.names, "un thème") : "un thème";

  return (
    <AppDialog
      open={!!invitation}
      onClose={() => undefined}
      title="Défi reçu"
      sheetOnTouch
      footerClassName="compact:flex-row compact:items-center"
      footer={
        <>
          <Button
            variant="ghost"
            disabled={actions.pending}
            onClick={() => void actions.refuse(current)}
          >
            Refuser
          </Button>
          <Button
            disabled={actions.pending}
            onClick={() => void actions.accept(current)}
          >
            Accepter
          </Button>
        </>
      }
    >
      <p className="flex items-start gap-2.5 text-sm text-muted-foreground">
        <Swords className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <span>
          <span className="font-medium text-foreground">{name}</span> te défie sur{" "}
          <span className="font-medium text-foreground">{topicLabel}</span>.
        </span>
      </p>
    </AppDialog>
  );
}
