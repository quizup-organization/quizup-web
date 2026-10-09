import { ShareDialog } from "@/shared/components/share-dialog";
import { topicShareMessage } from "../domain/share";

interface TopicShareDialogProps {
  open: boolean;
  onClose: () => void;
  topicId: string;
  topicName: string;
}

/**
 * Partage social d'un thème : QR, réseaux (WhatsApp / X / Facebook / Telegram), partage natif
 * et copie du lien. Dialog sur desktop, bottom sheet en tactile. Un invité sans compte est
 * redirigé vers l'authentification puis revient directement sur le thème (`/topics/{topicId}`).
 */
export function TopicShareDialog({
  open,
  onClose,
  topicId,
  topicName,
}: TopicShareDialogProps) {
  return (
    <ShareDialog
      open={open}
      onClose={onClose}
      title="Partager ce thème"
      sub="Envoie le lien : ton invité crée son compte s'il n'en a pas et arrive directement sur le thème."
      text={topicShareMessage(topicName)}
      url={`${window.location.origin}/topics/${topicId}`}
    />
  );
}
