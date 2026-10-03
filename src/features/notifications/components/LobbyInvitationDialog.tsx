import { Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlayerProfile } from "@/features/player";
import { useTopicOverview } from "@/features/topic";
import { useNotificationStore } from "../stores/useNotificationStore";
import { useLobbyInvitationActions } from "../hooks/useLobbyInvitationActions";

/**
 * Modale d'invitation live : affichée dès qu'un défi nominatif arrive par
 * `/topic/notifications/{userId}`. Accepter rejoint le salon ; refuser le décline.
 */
export function LobbyInvitationDialog() {
  const invitation = useNotificationStore((s) => s.invitations[0]);
  const actions = useLobbyInvitationActions();
  const player = usePlayerProfile(invitation?.actorId ?? "");
  const topic = useTopicOverview(invitation?.topicId ?? "");

  if (!invitation) {
    return null;
  }

  const name = player.data?.pseudonym ?? "Un joueur";
  const topicName = topic.data?.topic.name ?? "un thème";

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Swords className="size-5 text-primary" /> Défi reçu
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{name}</span> te défie sur{" "}
            <span className="font-medium text-foreground">{topicName}</span>.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={actions.pending}
            onClick={() => void actions.refuse(invitation)}
          >
            Refuser
          </Button>
          <Button
            disabled={actions.pending}
            onClick={() => void actions.accept(invitation)}
          >
            Accepter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
