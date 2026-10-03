import type { Suggestion } from "@/features/shell/domain/suggestion";

/**
 * Filtre les suggestions pour le sélecteur de joueur cible : uniquement les joueurs
 * (jamais les sujets), sans soi-même, avec un libellé exploitable.
 */
export function playerSuggestions(
  suggestions: Suggestion[],
  selfUserId: string | null | undefined,
): Suggestion[] {
  return suggestions.filter(
    (suggestion) =>
      suggestion.type === "PLAYER" &&
      suggestion.id !== selfUserId &&
      Boolean(suggestion.label),
  );
}
