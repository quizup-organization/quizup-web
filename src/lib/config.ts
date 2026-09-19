/**
 * Configuration runtime du web (Vite). Les variables sont injectées via `.env`.
 */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:8080",
  oidcAuthority: import.meta.env.VITE_OIDC_AUTHORITY ?? "http://localhost:8085",
  oidcClientId: import.meta.env.VITE_OIDC_CLIENT_ID ?? "web",
  oidcRedirectUri:
    import.meta.env.VITE_OIDC_REDIRECT_URI ??
    `${window.location.origin}/callback`,
  oidcScope: "openid profile email",
} as const;
