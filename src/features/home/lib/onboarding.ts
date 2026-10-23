import { api } from "@/lib/api"
import { ENDPOINTS } from "@/lib/endpoints"
import type { Me } from "@/features/shell/domain/me"

/** Termine (ou passe) l'onboarding côté serveur et renvoie la vue à jour. */
export const onboardingService = {
  complete: (): Promise<Me> => api.post<Me>(ENDPOINTS.onboardingComplete),
}
