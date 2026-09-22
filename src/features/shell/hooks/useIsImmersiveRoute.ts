import { useLocation } from "react-router-dom";

/** Routes d'immersion (duel, recherche d'adversaire, lobby de défi) rendues dans le shell. */
export const IMMERSIVE_PREFIXES = ["/duel/", "/challenges/"];

/** Vrai lorsque la route courante est un écran d'immersion. */
export function useIsImmersiveRoute(): boolean {
  const { pathname } = useLocation();
  return IMMERSIVE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}
