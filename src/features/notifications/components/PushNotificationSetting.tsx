import { toast } from "sonner";
import { AnimatedSwitch } from "@/components/spectrumui/animated-switch";
import { FormRow } from "@/shared/components/form-section";
import { isIos, isStandalone } from "@/shared/utils/pwa";
import { useWebPush, type PushPermission } from "../hooks/useWebPush";

function descriptionFor(permission: PushPermission, subscribed: boolean): string {
  if (permission === "unsupported") {
    return isIos() && !isStandalone()
      ? "Sur iPhone/iPad : installe d'abord QuizUp sur l'écran d'accueil (iOS 16.4+) pour activer les notifications."
      : "Ton navigateur ne prend pas en charge les notifications push.";
  }
  if (permission === "denied") {
    return "Autorisation refusée — autorise les notifications pour ce site dans ton navigateur.";
  }
  return subscribed
    ? "Tes défis et abonnements arrivent même quand QuizUp est fermé."
    : "Reçois tes défis et abonnements même quand QuizUp est fermé.";
}

/**
 * Réglage « Notifications push » : canal appareil (là où les préférences serveur filtrent par
 * catégorie). L'activation demande la permission dans le geste utilisateur (requis par iOS).
 */
export function PushNotificationSetting() {
  const push = useWebPush();

  const onToggle = (checked: boolean) => {
    void (checked ? push.enable() : push.disable()).catch(() => {
      toast.error(
        checked
          ? "Activation des notifications push impossible."
          : "Désactivation des notifications push impossible.",
      );
    });
  };

  return (
    <FormRow
      label="Notifications push"
      description={descriptionFor(push.permission, push.subscribed)}
      controlClassName="flex sm:justify-end"
    >
      <AnimatedSwitch
        label="Notifications push"
        checked={push.subscribed}
        disabled={
          !push.supported || push.permission === "denied" || push.busy
        }
        onCheckedChange={onToggle}
      />
    </FormRow>
  );
}
