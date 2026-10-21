import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useTopicName } from "@/features/shell"
import { tierKeyOf } from "../components/labels"
import {
  titleLabel,
  titleRankOf,
  topicTitleFor,
  type UnlockedTitle,
} from "../domain/progression"

/**
 * Compose le libellé d'affichage d'un titre débloqué : le titre **thématique** du sujet s'il
 * existe (« Historien confirmé »), sinon le **palier seul** (« Fer · Histoire »). Les libellés
 * de grade (Novice/Apprenti…) ne sont plus affichés. Le serveur ne fige aucun texte — le libellé
 * suit le renommage du sujet et la langue du lecteur.
 */
export function useTitleLabel(): (title: UnlockedTitle) => string {
  const { t, i18n } = useTranslation()
  const resolveName = useTopicName()

  return useCallback(
    (title: UnlockedTitle) =>
      topicTitleFor(title.topic.titles, title.grade, i18n.language) ??
      titleLabel(t(tierKeyOf(titleRankOf(title))), resolveName(title.topic.names)),
    [t, i18n.language, resolveName]
  )
}
