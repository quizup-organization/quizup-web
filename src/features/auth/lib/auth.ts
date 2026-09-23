import { api } from "@/lib/api";
import { ENDPOINTS } from "@/lib/endpoints";

export interface AuthResponse {
  userId: string;
  email: string;
}

/**
 * API JSON d'authentification passwordless (code OTP email).
 * `requestCode` demande un code (`POST /api/auth/login-codes`) ; `verifyCode` établit la session
 * interactive temporaire (`POST /api/auth/sessions`, cookie `AUTH_TX`). Le pipeline OIDC (code
 * d'autorisation + PKCE) est ensuite déclenché par `loginRedirect`.
 */
export const authService = {
  requestCode: (email: string): Promise<void> =>
    api.post<void>(ENDPOINTS.auth.loginCodes, { email }, {
      absolute: true,
      credentials: "include",
      skipErrorBus: true,
      skipAuthRefresh: true,
    }),

  verifyCode: (email: string, code: string): Promise<AuthResponse> =>
    api.post<AuthResponse>(ENDPOINTS.auth.sessions, { email, code }, {
      absolute: true,
      credentials: "include",
      skipErrorBus: true,
      skipAuthRefresh: true,
    }),

  logout: (refreshToken?: string): Promise<void> =>
    api.delete<void>(ENDPOINTS.auth.currentSession, {
      absolute: true,
      credentials: "include",
      skipErrorBus: true,
      skipAuthRefresh: true,
      body: refreshToken ? { refreshToken } : undefined,
    }),
};
