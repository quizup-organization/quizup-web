import { useEffect } from "react";
import { toast } from "sonner";
import { apiErrorBus } from "@/lib/error-bus";
import { clearSession } from "@/features/auth";

/**
 * Relaie les erreurs du client HTTP vers des toasts (sonner).
 *
 * Un `401` signifie une session définitivement invalide (le client HTTP a déjà tenté un
 * refresh + rejeu) : on **purge localement** la session, sans révoquer le refresh token
 * côté identity — une révocation serait irréversible et transformerait un 401 transitoire
 * en ré-authentification complète. La redirection `/login` est assurée par `RequireAuth`.
 */
export function ErrorToasterBridge() {
  useEffect(() => {
    let cleared = false;
    return apiErrorBus.subscribe((error) => {
      if (error.statusCode === 401) {
        if (cleared) return;
        cleared = true;
        void clearSession();
        return;
      }
      toast.error(error.message, { description: error.detail });
    });
  }, []);

  return null;
}
