import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

export interface AuthResponse {
  userId: string;
  email: string;
}

/**
 * API JSON d'authentification passwordless (code OTP email).
 * `requestCode` déclenche l'envoi du code ; `verifyCode` établit la session interactive
 * temporaire (cookie `AUTH_TX`). Le pipeline OIDC (code d'autorisation + PKCE) est ensuite
 * déclenché par `loginRedirect`.
 */
export const authService = {
  requestCode: (email: string): Promise<void> =>
    api.post<void>(ENDPOINTS.auth.requestCode, { email }, {
      absolute: true,
      credentials: "include",
      skipErrorBus: true,
      skipAuthRefresh: true,
    }),

  verifyCode: (email: string, code: string): Promise<AuthResponse> =>
    api.post<AuthResponse>(ENDPOINTS.auth.verifyCode, { email, code }, {
      absolute: true,
      credentials: "include",
      skipErrorBus: true,
      skipAuthRefresh: true,
    }),

  logout: (refreshToken?: string): Promise<void> =>
    api.post<void>(
      ENDPOINTS.auth.logout,
      refreshToken ? { refreshToken } : undefined,
      {
        absolute: true,
        credentials: "include",
        skipErrorBus: true,
        skipAuthRefresh: true,
      },
    ),
};
