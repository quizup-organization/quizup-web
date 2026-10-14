import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"
import { progressionService } from "../lib/progression"

/**
 * Titres thématiques d'un joueur : libellés des titres débloqués et **clé du titre porté**.
 * C'est cette vue qui porte le libellé affiché sur le profil (le serveur ne compose pas
 * « Confirmé · Histoire », il expose le grade et le sujet).
 */
export function usePlayerTitles(userId: string) {
  return useQuery({
    queryKey: queryKeys.profiles.titles(userId),
    queryFn: () => progressionService.titles(userId),
    enabled: userId !== "",
    staleTime: 60 * 1000,
  })
}
