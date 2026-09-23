import { User, UserManager, WebStorageStateStore } from "oidc-client-ts";
import { config } from "@/lib/config";
import { queryClient } from "@/lib/query-client";
import { registerSessionGateway } from "@/lib/session";
import { authService } from "@/lib/services/auth";
import {
  getRefreshToken,
  getSessionUser as currentUser,
  useSessionStore,
} from "../stores/useSessionStore";

/**
 * Moteur OIDC (Authorization Code + PKCE) unique. L'échange de tokens se fait auprès de
 * l'issuer `quizup-identity` ; les appels métier passent par la gateway.
 *
 * Ce module câble `oidc-client-ts` sur le store de session (source unique) et enregistre
 * le `SessionGateway` consommé par `lib/` (client HTTP, WebSocket). Aucun état global
 * parallèle : `useSessionStore` est la seule vérité.
 */
export const userManager = new UserManager({
  authority: config.oidcAuthority,
  client_id: config.oidcClientId,
  redirect_uri: config.oidcRedirectUri,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope: config.oidcScope,
  loadUserInfo: false,
  automaticSilentRenew: true,
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});

const USER_STORE_KEY = `user:${config.oidcAuthority}:${config.oidcClientId}`;

const sessionListeners = new Set<() => void>();

function syncUser(user: User | null): void {
  useSessionStore.getState().setUser(user);
  sessionListeners.forEach((listener) => listener());
}

userManager.events.addUserLoaded((user) => syncUser(user));
userManager.events.addUserUnloaded(() => syncUser(null));
userManager.events.addSilentRenewError(() => {
  // `automaticSilentRenew` a épuisé ses tentatives : on tente un renouvellement explicite
  // puis, seulement en cas d'échec définitif, on purge localement (jamais de révocation
  // serveur : un 401 transitoire ne doit pas invalider le refresh token).
  void refreshSession().then((user) => {
    if (!user) void clearSession();
  });
});

// Multi-onglets : un logout ou une rotation de refresh token dans un autre onglet met à
// jour le stockage partagé ; on resynchronise le store (et les WS) sans recharger la page.
window.addEventListener("storage", (event) => {
  if (event.key !== USER_STORE_KEY) return;
  void userManager.getUser().then((user) => syncUser(user));
});

/** Purge locale : retire les tokens du stockage, vide le cache et repasse en anonyme. */
export async function clearSession(): Promise<void> {
  syncUser(null);
  await userManager.removeUser();
  queryClient.clear();
}

/** Déconnexion volontaire : révoque l'autorisation identity puis purge localement. */
export async function logout(): Promise<void> {
  try {
    await authService.logout(getRefreshToken() ?? undefined);
  } catch {
    // session déjà expirée : on purge quand même côté client
  }
  await clearSession();
}

async function renewOnce(): Promise<User | null> {
  // Un autre onglet a peut-être déjà rafraîchi : on recharge depuis le stockage partagé.
  const stored = await userManager.getUser();
  if (stored && !stored.expired) {
    syncUser(stored);
    return stored;
  }
  try {
    const user = await userManager.signinSilent();
    syncUser(user);
    return user;
  } catch {
    return null;
  }
}

let refreshPromise: Promise<User | null> | null = null;

/**
 * Renouvellement single-flight : plusieurs 401 concurrents (ou un renew qui chevauche)
 * ne déclenchent qu'une seule requête `refresh_token` (la rotation `reuse-refresh-tokens:
 * false` invaliderait le perdant). Le verrou `navigator.locks` étend la garantie aux
 * autres onglets. Retourne `null` en cas d'échec, sans purger l'état.
 */
export function refreshSession(): Promise<User | null> {
  if (refreshPromise) return refreshPromise;

  const execute = (): Promise<User | null> =>
    navigator.locks?.request
      ? navigator.locks.request("quizup-session-refresh", renewOnce)
      : renewOnce();

  refreshPromise = execute().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function initSession(): Promise<User | null> {
  try {
    let user = await userManager.getUser();
    if (user?.expired) {
      user = await refreshSession();
      if (!user) {
        await clearSession();
        return null;
      }
    }
    syncUser(user);
    return user;
  } catch {
    await clearSession();
    return null;
  }
}

export async function loginRedirect(returnTo?: string): Promise<void> {
  await userManager.signinRedirect({ state: returnTo });
}

export async function completeLogin(): Promise<User> {
  const user = await userManager.signinRedirectCallback();
  syncUser(user);
  return user;
}

// Le client HTTP et le WebSocket lisent le token via ce gateway (pas d'import inverse).
registerSessionGateway({
  getAccessToken: () => currentUser()?.access_token ?? null,
  refresh: async () => (await refreshSession())?.access_token ?? null,
  clear: clearSession,
  subscribe: (listener) => {
    sessionListeners.add(listener);
    return () => {
      sessionListeners.delete(listener);
    };
  },
});

export type { User };
