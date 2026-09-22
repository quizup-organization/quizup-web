import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "oidc-client-ts";
import {
  completeLogin as completeLoginOidc,
  getRefreshToken,
  initSession,
  loginRedirect,
  logout as logoutOidc,
  userManager,
} from "@/lib/auth";
import { authService } from "@/lib/services/auth";
import { AuthContext, type AuthContextValue } from "./auth-context";

function extractUserId(user: User | null): string | null {
  const profile = user?.profile as { user_id?: string; sub?: string } | undefined;
  return profile?.user_id ?? profile?.sub ?? null;
}

function extractDisplayName(user: User | null): string | null {
  const profile = user?.profile as
    | { email?: string; preferred_username?: string }
    | undefined;
  return profile?.preferred_username ?? profile?.email ?? null;
}

/**
 * Fournit la session OIDC à l'application (source réactive) : initialise la session au
 * démarrage, suit les événements `oidc-client-ts` (chargement/silent renew/déchargement) et
 * expose les actions de connexion/déconnexion. Le logout révoque le refresh token puis purge
 * l'état React, ce qui fait retomber `authenticated` immédiatement.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    initSession()
      .then((session) => {
        if (active) setUser(session);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onLoaded = (loaded: User) => setUser(loaded);
    const onUnloaded = () => setUser(null);
    userManager.events.addUserLoaded(onLoaded);
    userManager.events.addUserUnloaded(onUnloaded);
    return () => {
      userManager.events.removeUserLoaded(onLoaded);
      userManager.events.removeUserUnloaded(onUnloaded);
    };
  }, []);

  const login = useCallback((returnTo?: string) => loginRedirect(returnTo), []);

  const completeLogin = useCallback(async () => {
    const completed = await completeLoginOidc();
    setUser(completed);
    return completed;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout(getRefreshToken() ?? undefined);
    } catch {
      // session déjà expirée : on purge quand même côté client
    }
    await logoutOidc();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      userId: extractUserId(user),
      displayName: extractDisplayName(user),
      authenticated: user !== null,
      ready,
      login,
      completeLogin,
      logout,
    }),
    [user, ready, login, completeLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
