import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useTopicName } from "@/features/shell"
import { GRADE_KEYS } from "../components/labels"
import {
  titleLabel,
  topicTitleFor,
  type UnlockedTitle,
} from "../domain/progression"

/**
 * Compose le libellé d'affichage d'un titre débloqué : le titre **thématique** du sujet s'il
 * existe (« Historien confirmé »), sinon la composition générique « Confirmé · Histoire ». Le
 * serveur ne fige aucun texte — le libellé suit le renommage du sujet et la langue du lecteur.
 */
export function useTitleLabel(): (title: UnlockedTitle) => string {
  const { t, i18n } = useTranslation()
  const resolveName = useTopicName()

  return useCallback(
    (title: UnlockedTitle) =>
      topicTitleFor(title.topic.titles, title.grade, i18n.language) ??
      titleLabel(t(GRADE_KEYS[title.grade]), resolveName(title.topic.names)),
    [t, i18n.language, resolveName]
  )
}
