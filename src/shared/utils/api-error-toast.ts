import type { ApiErrorEvent } from "@/lib/error-bus";

const ROOM_NOT_FOUND = "urn:quizup:room:notFound";
const CHALLENGE_NOT_PENDING = "urn:quizup:challenge:notPending";

/**
 * Traduit une erreur API en message de toast. Quelques problèmes métier ont un message dédié
 * (salle expirée/purgée, défi plus actionnable) ; les autres gardent le message/détail du backend.
 */
export function apiErrorToast(error: ApiErrorEvent): {
  title: string;
  description?: string;
} {
  if (error.type === ROOM_NOT_FOUND) {
    return {
      title: "Ce défi n'est plus disponible",
      description: "Le salon a expiré ou a déjà été fermé.",
    };
  }

  if (error.type === CHALLENGE_NOT_PENDING) {
    return {
      title: "Ce défi n'est plus disponible",
      description: "Il a été annulé ou déjà résolu.",
    };
  }

  return { title: error.message, description: error.detail };
}
