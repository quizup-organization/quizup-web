import { useEffect } from "react";
import { toast } from "sonner";
import { apiErrorBus } from "@/lib/error-bus";
import { logout } from "@/lib/auth";

/**
 * Relaie les erreurs du client HTTP vers des toasts (sonner).
 * Un 401 signifie une session expirée/invalide : on purge la session et on renvoie
 * vers /login plutôt que d'afficher un toast.
 */
export function ErrorToasterBridge() {
  useEffect(
    () =>
      apiErrorBus.subscribe((error) => {
        if (error.statusCode === 401) {
          void logout().finally(() => {
            window.location.href = "/login";
          });
          return;
        }
        toast.error(error.message, { description: error.detail });
      }),
    [],
  );

  return null;
}
