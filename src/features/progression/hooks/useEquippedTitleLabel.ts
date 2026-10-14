import { useTranslation } from "react-i18next"
import { useTopicName } from "@/features/shell"
import { GRADE_KEYS } from "../components/labels"
import {
  equippedTitle,
  titleLabel,
  type PlayerTitles,
} from "../domain/progression"

/**
 * Libellé du **titre porté** d'un joueur (« Confirmé · Histoire »), prêt à afficher dans le
 * bandeau de profil ou une carte. `null` si le joueur n'affiche aucun titre — l'appelant retombe
 * alors sur le titre de compte transitoire, le temps que l'UI bascule complètement.
 */
export function useEquippedTitleLabel(
  titles: PlayerTitles | undefined
): string | null {
  const { t } = useTranslation()
  const resolveName = useTopicName()

  const equipped = equippedTitle(titles)
  if (!equipped) {
    return null
  }

  return titleLabel(
    t(GRADE_KEYS[equipped.grade]),
    resolveName(equipped.topic.names)
  )
}
