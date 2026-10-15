import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useProfileTopicStats } from "@/features/player"
import { useTopicName } from "@/features/shell"
import { buildTopicsPlayedChart } from "../domain/topics-played-chart"
import { TopicsPlayedDonut } from "./TopicsPlayedDonut"

/**
 * Section « Sujets joués » du profil : donut des **parties humaines** par sujet (couleurs
 * éditoriales des sujets, 6 parts + « Autres ») posé dans une carte pour la visibilité. Masquée
 * tant que le joueur n'a joué aucun duel humain.
 */
export function TopicsPlayedSection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const resolveName = useTopicName()
  const { data, isLoading } = useProfileTopicStats(userId)

  const played = data ?? []
  if (isLoading || played.every((stat) => stat.games <= 0)) return null

  const chart = buildTopicsPlayedChart(
    played.map((stat) => ({
      key: stat.topicId,
      label: resolveName(stat.names),
      value: stat.games,
      color: stat.color,
    })),
    {
      maxSegments: 6,
      minShare: 0.02,
      otherLabel: t("shell.profile.topicsOther"),
    }
  )

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t("shell.profile.topicsTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <TopicsPlayedDonut
          chart={chart}
          ariaLabel={t("shell.profile.topicsAria")}
        />
      </CardContent>
    </Card>
  )
}
