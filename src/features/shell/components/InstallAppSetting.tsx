import { Button } from "@/components/ui/button";
import { FormRow } from "@/shared/components/form-section";
import { isIos, isStandalone } from "@/shared/utils/pwa";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

/**
 * Réglage « Installer QuizUp » : bouton natif quand le navigateur l'expose (Chrome/Edge),
 * consignes manuelles sur iOS ; masqué une fois l'app installée.
 */
export function InstallAppSetting() {
  const { canInstall, installed, promptInstall } = useInstallPrompt();
  const iosBrowser = isIos() && !isStandalone();

  if (installed || (!canInstall && !iosBrowser)) return null;

  return (
    <FormRow
      label="Installer QuizUp"
      description={
        iosBrowser
          ? "Sur iPhone/iPad : bouton Partager puis « Sur l'écran d'accueil »."
          : "Ouvre QuizUp comme une app, en plein écran (et prérequis des notifications sur iOS)."
      }
      controlClassName="flex sm:justify-end"
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
  );
}
