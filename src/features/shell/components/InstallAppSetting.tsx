import { Button } from "@/components/ui/button";
import { FormRow } from "@/shared/components/form-section";
import { isFirefox, isIos } from "@/shared/utils/pwa";
import { useInstallPrompt } from "../hooks/useInstallPrompt";

/**
 * Réglage « Installer QuizUp ». Chrome/Edge exposent `beforeinstallprompt` (capté au boot) ;
 * iOS passe par Partager → écran d'accueil ; Firefox ne supporte pas l'installation de PWA
 * (message explicite, pas de bouton) ; les autres navigateurs suivent le menu natif.
 * Masqué une fois l'app installée.
 */
export function InstallAppSetting() {
  const { canInstall, installed, promptInstall } = useInstallPrompt();

  if (installed) return null;

  const iosBrowser = isIos();
  const firefox = !iosBrowser && isFirefox();

  let description: string;
  let fallbackLabel: string;
  if (iosBrowser) {
    description =
      "Sur iPhone/iPad : bouton Partager puis « Sur l'écran d'accueil ».";
    fallbackLabel = "Écran d'accueil";
  } else if (firefox) {
    description =
      "Firefox ne permet pas d'installer les applications web. Ouvre QuizUp dans Chrome ou Edge pour l'installer (plein écran et push permanent).";
    fallbackLabel = "Chrome / Edge";
  } else if (canInstall) {
    description =
      "Ouvre QuizUp comme une app, en plein écran (et prérequis des notifications sur iOS).";
    fallbackLabel = "Menu navigateur";
  } else {
    description =
      "Depuis le menu du navigateur : « Installer l'application » (Safari : Fichier → Ajouter au Dock).";
    fallbackLabel = "Menu navigateur";
  }

  return (
    <FormRow
      label="Installer QuizUp"
      description={description}
      controlClassName="flex sm:justify-end"
    >
      {canInstall && !firefox ? (
        <Button
          type="button"
          variant="outline"
          onClick={() => void promptInstall()}
        >
          Installer
        </Button>
      ) : (
        <span className="text-xs text-muted-foreground">{fallbackLabel}</span>
      )}
    </FormRow>
  );
}
