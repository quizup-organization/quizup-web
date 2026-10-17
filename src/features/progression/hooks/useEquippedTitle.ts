import type {
  PlayerTitles,
  TitleRank,
  UnlockedTitle,
} from "../domain/progression"
import { equippedTitle, titleRankOf } from "../domain/progression"

/** Titre porté avec son rang résolu (serveur ou table de repli). */
export type EquippedTitle = UnlockedTitle & { rank: TitleRank }

/**
 * Titre **porté** résolu dans la liste des titres débloqués (`null` si aucun ou introuvable),
 * avec son rang garanti : le champ `rank` du BFF s'il est présent, sinon la correspondance
 * grade → rang (compatibilité PWA).
 */
export function useEquippedTitle(
  titles: PlayerTitles | undefined
): EquippedTitle | null {
  const title = equippedTitle(titles)
  return title ? { ...title, rank: titleRankOf(title) } : null
}
