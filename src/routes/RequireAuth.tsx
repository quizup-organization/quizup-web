import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/features/auth";

/** Redirige vers /login si aucune session OIDC n'est active. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { authenticated } = useSession();
  const location = useLocation();

  if (!authenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}
