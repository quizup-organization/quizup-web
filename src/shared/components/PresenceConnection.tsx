import { useEffect } from "react";
import { retainStompConnection } from "@/lib/ws";
import { useSessionStore } from "@/features/auth/stores/useSessionStore";

/**
 * Maintient la connexion STOMP `profile` ouverte pour toute session authentifiée, quelle que
 * soit la route (y compris l'arène et le lobby, rendus hors de la coquille applicative).
 * Le `CONNECT` authentifié (JWT) est le signal de présence côté serveur : plus de battement de
 * cœur ni de polling.
 */
export function PresenceConnection() {
  const authenticated = useSessionStore((s) => s.authenticated);

  useEffect(() => {
    if (!authenticated) return;
    return retainStompConnection("profile");
  }, [authenticated]);

  return null;
}
