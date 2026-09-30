import type { ApiErrorEvent } from "@/lib/error-bus";

const CHALLENGE_TOPIC_LANGUAGE = "urn:quizup:challenge:topicNotAvailableInLanguage";

/**
 * Traduit une erreur API en message de toast. Quelques problèmes métier ont un message dédié
 * (langue indisponible pour un défi) ; les autres gardent le message/détail du backend.
 */
export function apiErrorToast(error: ApiErrorEvent): {
  title: string;
  description?: string;
} {
  if (error.type === CHALLENGE_TOPIC_LANGUAGE) {
    return {
      title: "Défi impossible",
      description:
        "Ce thème n'est pas disponible dans la langue de l'autre joueur.",
    };
  }

  return { title: error.message, description: error.detail };
}
