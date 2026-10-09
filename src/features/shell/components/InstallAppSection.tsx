import { Button } from "@/components/ui/button";
import { FormRow, FormSection } from "@/shared/components/form-section";
import { isIos, shouldOfferInstall } from "@/shared/utils/pwa";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

/**
 * Section « Application » (Réglages) : installable via le bouton natif (Chrome/Edge,
 * `beforeinstallprompt` capté au boot) ou consignes iOS (Partager → écran d'accueil, prérequis
 * du push). **Masquée** si l'app est déjà installée ou si le navigateur ne permet pas
 * l'installation (Firefox, Safari macOS…).
 */
export function InstallAppSection() {
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const iosBrowser = isIos();

  if (!shouldOfferInstall({ installed, canInstall, ios: iosBrowser })) {
    return null;
  }

  return (
    <FormSection
      title="Application"
      sub="Installe QuizUp pour un affichage plein écran et les notifications push."
    >
      <FormRow
        label="Installer QuizUp"
        description={
          canInstall
            ? "Ouvre QuizUp comme une app, en plein écran."
            : "Sur iPhone/iPad : bouton Partager puis « Sur l'écran d'accueil »."
        }
        controlClassName="flex tablet-up:justify-end"
      >
        {canInstall ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void promptInstall()}
          >
            Installer
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">Écran d'accueil</span>
        )}
      </FormRow>
    </FormSection>
  );
}
