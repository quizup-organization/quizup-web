import type { ApiErrorEvent } from "@/lib/error-bus";

const LOBBY_TOPIC_LANGUAGE = "urn:quizup:lobby:topicNotAvailableInLanguage";

/**
 * Traduit une erreur API en message de toast. Quelques problèmes métier ont un message dédié
 * (thème indisponible dans la langue de l'autre joueur pour un défi) ; les autres gardent le
 * message/détail du backend.
 */
export function apiErrorToast(error: ApiErrorEvent): {
  title: string;
  description?: string;
} {
  if (error.type === LOBBY_TOPIC_LANGUAGE) {
    return {
      title: "Défi impossible",
      description:
        "Ce thème n'est pas disponible dans la langue de l'autre joueur.",
    };
  }

  return { title: error.message, description: error.detail };
}
