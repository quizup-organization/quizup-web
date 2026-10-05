import { Button } from "@/components/ui/button";
import { FormRow } from "@/shared/components/form-section";
import { isIos } from "@/shared/utils/pwa";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

/**
 * Réglage « Installer QuizUp » : bouton natif quand le navigateur expose
 * `beforeinstallprompt` (Chrome/Edge, capté au boot), consignes manuelles sinon (iOS,
 * autres navigateurs). Masqué une fois l'app installée.
 */
export function InstallAppSetting() {
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  if (installed) return null;

  const iosBrowser = isIos();
  const description = iosBrowser
    ? "Sur iPhone/iPad : bouton Partager puis « Sur l'écran d'accueil »."
    : canInstall
      ? "Ouvre QuizUp comme une app, en plein écran (et prérequis des notifications sur iOS)."
      : "Depuis le menu du navigateur : « Installer l'application » (ou l'icône d'installation dans la barre d'adresse).";

  return (
    <FormRow
      label="Installer QuizUp"
      description={description}
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
        <span className="text-xs text-muted-foreground">
          {iosBrowser ? "Écran d'accueil" : "Menu navigateur"}
        </span>
      )}
    </FormRow>
  );
}
