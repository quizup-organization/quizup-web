import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Retour natif (historique navigateur) avec repli explicite quand il n'y a pas d'historique
 * (arrivée directe par lien) — évite les redirections artificielles vers une page fixe.
 */
export function useGoBack(fallback = "/") {
  const navigate = useNavigate();

  return useCallback(() => {
    const state = window.history.state as { idx?: number } | null;
    if ((state?.idx ?? 0) > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }, [navigate, fallback]);
}
