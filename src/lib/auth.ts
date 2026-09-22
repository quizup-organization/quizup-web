import { User, UserManager, WebStorageStateStore } from "oidc-client-ts";
import { config } from "./config";

/**
 * Client OIDC (Authorization Code + PKCE) partagé.
 * L'échange de tokens se fait directement auprès de l'issuer `quizup-identity`
 * (`config.oidcAuthority`) — les appels métier passent, eux, par la gateway.
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

let currentUser: User | null = null;

userManager.events.addUserLoaded((user) => {
  currentUser = user;
});
userManager.events.addUserUnloaded(() => {
  currentUser = null;
});
userManager.events.addSilentRenewError(() => {
  // Le renouvellement silencieux a échoué (refresh token expiré/révoqué) : purger la
  // session et renvoyer au login plutôt que de conserver un token périmé.
  currentUser = null;
  void userManager.removeUser().finally(() => {
    if (window.location.pathname !== "/login") {
      window.location.href = "/login";
    }
  });
});

export function getAccessToken(): string | null {
  return currentUser?.access_token ?? null;
}

export function getRefreshToken(): string | null {
  return currentUser?.refresh_token ?? null;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function getUserId(): string | null {
  const profile = currentUser?.profile as
    | { user_id?: string; sub?: string }
    | undefined;
  return profile?.user_id ?? profile?.sub ?? null;
}

export function getDisplayName(): string | null {
  const profile = currentUser?.profile as
    | { email?: string; preferred_username?: string }
    | undefined;
  return profile?.preferred_username ?? profile?.email ?? null;
}

export async function initSession(): Promise<User | null> {
  let user = await userManager.getUser();
  if (user?.expired) {
    // Access token déjà expiré au chargement : `automaticSilentRenew` ne déclenche pas
    // l'événement « expiring » dans ce cas, on rafraîchit donc explicitement via le
    // refresh token (le cas échéant).
    try {
      user = await userManager.signinSilent();
    } catch {
      currentUser = null;
      await userManager.removeUser();
      return null;
    }
  }
  currentUser = user;
  return currentUser;
}

export async function loginRedirect(returnTo?: string): Promise<void> {
  await userManager.signinRedirect({ state: returnTo });
}

export async function completeLogin(): Promise<User> {
  const user = await userManager.signinRedirectCallback();
  currentUser = user;
  return user;
}

export async function logout(): Promise<void> {
  currentUser = null;
  await userManager.removeUser();
}

export type { User };
