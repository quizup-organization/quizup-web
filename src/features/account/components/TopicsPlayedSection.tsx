import { useTranslation } from "react-i18next"
import {
  DonutChart,
  type DonutChartLabels,
} from "@/components/arc/donut-chart/donut-chart"
import { useProfileTopicStats } from "@/features/player"
import { useTopicName } from "@/features/shell"
import { useLocale } from "@/lib/i18n/useLocale"

/**
 * Section « Sujets joués » du profil : donut des **parties humaines** par sujet (couleurs
 * éditoriales des sujets, 6 parts + « Autres », légende synchronisée). Masquée tant que le
 * joueur n'a joué aucun duel humain.
 */
export function TopicsPlayedSection({ userId }: { userId: string }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const resolveName = useTopicName()
  const { data, isLoading } = useProfileTopicStats(userId)

  const played = (data ?? []).filter((stat) => stat.games > 0)
  if (isLoading || played.length === 0) return null

  // Localisation du composant vendored (défauts anglais du registry).
  const labels: Partial<DonutChartLabels> = {
    hidden: (name) => t("shared.donut.hidden", { name }),
    visibilityHidden: (name, total) =>
      t("shared.donut.visibilityHidden", { name, total }),
    visibilityShown: (name, total) =>
      t("shared.donut.visibilityShown", { name, total }),
    includes: (names) => t("shared.donut.includes", { names }),
    and: t("shared.donut.and"),
    andMore: (count) => t("shared.donut.andMore", { count }),
    of: (total) => t("shared.donut.of", { total }),
    segment: t("shared.donut.segment"),
    value: t("shared.donut.value"),
    share: t("shared.donut.share"),
    legend: (label, toggle) =>
      toggle
        ? t("shared.donut.legendToggle", { label })
        : t("shared.donut.legend", { label }),
    ring: (label) => t("shared.donut.ring", { label }),
  }

  return (
    <section className="mb-8">
      <h2 className="mb-4 font-heading text-base font-semibold">
        {t("shell.profile.topicsTitle")}
      </h2>
      <div className="flex justify-center">
        <DonutChart
          data={played.map((stat) => ({
            key: stat.topicId,
            label: resolveName(stat.names),
            value: stat.games,
            color: stat.color ?? undefined,
          }))}
          label={t("shell.profile.topicsAria")}
          unit={t("shell.profile.topicsUnit")}
          totalLabel={t("shell.profile.topicsTotal")}
          otherLabel={t("shell.profile.topicsOther")}
          locale={locale}
          labels={labels}
          maxSegments={7}
          groupBelow={0.02}
          size={240}
        />
      </div>
    </section>
  )
}
