import { QRCodeSVG } from "qrcode.react";
import { AppDialog } from "@/shared/components/app-dialog";
import { ShareActions } from "@/shared/components/share-actions";
import { topicShareMessage } from "../domain/share";

interface TopicShareDialogProps {
  open: boolean;
  onClose: () => void;
  topicId: string;
  topicName: string;
}

/**
 * Partage social d'un thème : QR, réseaux (WhatsApp / X / Facebook / Telegram), partage natif
 * et copie du lien. Un invité sans compte est redirigé vers l'authentification puis revient
 * directement sur le thème (`/topics/{topicId}`).
 */
export function TopicShareDialog({
  open,
  onClose,
  topicId,
  topicName,
}: TopicShareDialogProps) {
  const shareUrl = `${window.location.origin}/topics/${topicId}`;

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Partager ce thème"
      sub="Envoie le lien : ton invité crée son compte s'il n'en a pas et arrive directement sur le thème."
      className="sm:max-w-md"
    >
      <div className="flex flex-col items-center">
        <div className="grid place-items-center rounded-2xl bg-white p-3 shadow-lg">
          <QRCodeSVG value={shareUrl} size={160} />
        </div>
        <div className="w-full">
          <ShareActions text={topicShareMessage(topicName)} url={shareUrl} />
        </div>
      </div>
    </AppDialog>
  );
}
