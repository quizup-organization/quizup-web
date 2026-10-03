import type { ApiErrorEvent } from "@/lib/error-bus";

const LOBBY_TOPIC_LANGUAGE = "urn:quizup:lobby:topicNotAvailableInLanguage";
const LOBBY_NOT_FOUND = "urn:quizup:lobby:notFound";

/**
 * Traduit une erreur API en message de toast. Quelques problèmes métier ont un message dédié
 * (thème indisponible dans la langue de l'autre joueur pour un défi, salon expiré/purgé) ;
 * les autres gardent le message/détail du backend.
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

  if (error.type === LOBBY_NOT_FOUND) {
    return {
      title: "Ce défi n'est plus disponible",
      description: "Le salon a expiré ou a déjà été fermé.",
    };
  }

  return { title: error.message, description: error.detail };
}
