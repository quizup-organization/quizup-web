import { useState } from "react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/shared/components/share-dialog";
import { useIsTouchLayout } from "@/shared/hooks/use-device";
import { shareMessage } from "../domain/share";
import { LobbyShareCard } from "./LobbyShareCard";

interface LobbyInviteProps {
  shareUrl: string;
  topicName?: string;
}

/**
 * Invitation d'un salon privé : carte inline (lien + QR) sur grand écran, **bottom sheet** en
 * tactile — le contenu de partage s'ouvre alors via un bouton « Inviter un adversaire ».
 */
export function LobbyInvite({ shareUrl, topicName }: LobbyInviteProps) {
  const isTouch = useIsTouchLayout();
  const [open, setOpen] = useState(false);

  if (!isTouch) {
    return <LobbyShareCard shareUrl={shareUrl} topicName={topicName} />;
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full max-w-[380px]"
        onClick={() => setOpen(true)}
      >
        <Share2 size={15} /> Inviter un adversaire
      </Button>
      <ShareDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Inviter un adversaire"
        sub="Envoie ce lien ou partage-le sur tes réseaux : la partie démarre dès qu'il l'ouvre."
        text={shareMessage(topicName)}
        url={shareUrl}
      />
    </>
  );
}
