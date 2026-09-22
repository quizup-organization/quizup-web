import { createContext, useContext } from "react";
import type { User } from "oidc-client-ts";

export interface AuthContextValue {
  /** Utilisateur OIDC courant (null si non authentifié). */
  user: User | null;
  /** Identifiant QuizUp stable (claim `user_id`, sinon `sub`). */
  userId: string | null;
  /** Nom d'affichage (claim `preferred_username`, sinon `email`). */
  displayName: string | null;
  authenticated: boolean;
  /** Vrai une fois la session initiale résolue (évite de flasher le login). */
  ready: boolean;
  login: (returnTo?: string) => Promise<void>;
  completeLogin: () => Promise<User>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}
