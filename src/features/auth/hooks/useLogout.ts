import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/services/auth";
import { logout as clearSession } from "@/lib/auth";

/** Déconnexion : invalide la session identity puis purge les tokens OIDC. */
export function useLogout() {
  const navigate = useNavigate();
  return async () => {
    try {
      await authService.logout();
    } catch {
      // session déjà expirée : on purge quand même côté client
    }
    await clearSession();
    navigate("/login");
  };
}
