import { QRCodeSVG } from "qrcode.react";
import { AppDialog } from "@/shared/components/app-dialog";
import { ShareActions } from "@/shared/components/share-actions";
import { profileShareMessage } from "../domain/share";

interface ProfileShareDialogProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  name: string;
}

/**
 * Partage social de son profil : QR, réseaux (WhatsApp / X / Facebook / Telegram), partage natif
 * et copie du lien public `/players/{userId}`. Un invité sans compte crée le sien puis retombe
 * sur la fiche.
 */
export function ProfileShareDialog({
  open,
  onClose,
  userId,
  name,
}: ProfileShareDialogProps) {
  const shareUrl = `${window.location.origin}/players/${userId}`;

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title="Partager mon profil"
      sub="Envoie le lien : ton invité crée son compte s'il n'en a pas et découvre ton profil."
      className="sm:max-w-md"
    >
      <div className="flex flex-col items-center">
        <div className="grid place-items-center rounded-2xl bg-white p-3 shadow-lg">
          <QRCodeSVG value={shareUrl} size={160} />
        </div>
        <div className="w-full">
          <ShareActions text={profileShareMessage(name)} url={shareUrl} />
        </div>
      </div>
    </AppDialog>
  );
}
