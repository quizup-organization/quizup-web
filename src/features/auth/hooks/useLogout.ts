import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/providers/auth-context";

/** Déconnexion : révoque l'autorisation identity puis purge les tokens OIDC. */
export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  return async () => {
    await logout();
    navigate("/login");
  };
}
