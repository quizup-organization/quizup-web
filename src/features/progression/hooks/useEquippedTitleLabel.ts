import { useTranslation } from "react-i18next"
import { useTopicName } from "@/features/shell"
import { GRADE_KEYS } from "../components/labels"
import {
  equippedTitle,
  titleLabel,
  topicTitleFor,
  type PlayerTitles,
} from "../domain/progression"

/**
 * Libellé du **titre porté** d'un joueur : le titre **thématique** du sujet s'il existe
 * (« Historien confirmé »), sinon la composition générique « Confirmé · Histoire ». `null` si le
 * joueur n'affiche aucun titre — l'appelant retombe alors sur le titre de compte transitoire.
 */
export function useEquippedTitleLabel(
  titles: PlayerTitles | undefined
): string | null {
  const { t, i18n } = useTranslation()
  const resolveName = useTopicName()

  const equipped = equippedTitle(titles)
  if (!equipped) {
    return null
  }

  const thematic = topicTitleFor(
    equipped.topic.titles,
    equipped.grade,
    i18n.language
  )
  return (
    thematic ??
    titleLabel(t(GRADE_KEYS[equipped.grade]), resolveName(equipped.topic.names))
  )
}
