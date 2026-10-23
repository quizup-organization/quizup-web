import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Crown } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/shared/components/empty-state"
import { TopicIcon } from "@/shared/components/topic-icon"
import { showSuccessToast } from "@/shared/utils/success-toast"
import {
  BADGE_TIERS,
  titleRankOf,
  type PlayerTitles,
  type UnlockedTitle,
} from "../domain/progression"
import { useEquipTitle } from "../hooks/useEquipTitle"
import { useTitleLabel } from "../hooks/useTitleLabel"
import { RankBadge } from "./RankBadge"

interface ProfileTitlesSectionProps {
  userId: string
  titles: PlayerTitles | undefined
  isLoading?: boolean
}

function rankOrder(title: UnlockedTitle): number {
  return BADGE_TIERS.indexOf(titleRankOf(title))
}

/**
 * Onglet « Titres » du profil : liste **plate** des titres débloqués, triée du rang le plus rare
 * au plus commun. Le titre porté peut être retiré ; les autres peuvent être équipés directement.
 */
export function ProfileTitlesSection({
  userId,
  titles,
  isLoading = false,
}: ProfileTitlesSectionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const titleLabel = useTitleLabel()
  const equipTitle = useEquipTitle(userId)

  const sorted = useMemo(
    () =>
      [...(titles?.titles ?? [])].sort(
        (left, right) =>
          rankOrder(right) - rankOrder(left) ||
          titleLabel(left).localeCompare(titleLabel(right), undefined, {
            sensitivity: "base",
          })
      ),
    [titles, titleLabel]
  )

  if (isLoading) {
    return (
      <p className="py-8 text-sm text-muted-foreground">
        {t("progression.profileTitles.loading")}
      </p>
    )
  }

  if (!titles) return null

  if (sorted.length === 0) {
    return (
      <div className="py-8">
        <EmptyState
          icon={<Crown className="size-6 text-muted-foreground" />}
          title={t("progression.profileTitles.emptyTitle")}
          description={t("progression.profileTitles.emptyDescription")}
        >
          <Button variant="outline" onClick={() => void navigate("/topics")}>
            {t("progression.profileTitles.emptyAction")}
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-heading text-base font-semibold">
          {t("progression.profileTitles.title")}
        </h2>
        <span className="text-xs text-muted-foreground">
          {t("progression.profileTitles.count", { count: sorted.length })}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((title) => {
          const equipped = titles.equippedKey === title.key
          const label = titleLabel(title)
          return (
            <Card key={title.key} size="sm">
              <CardContent className="flex flex-col gap-3 tablet-up:flex-row tablet-up:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <TopicIcon topic={title.topic} size={38} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{label}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <RankBadge rank={titleRankOf(title)} />
                      {equipped && (
                        <span className="text-xs font-semibold text-primary">
                          {t("progression.titleEquipped")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 tablet-up:ml-auto">
                  <Button
                    size="sm"
                    variant={equipped ? "destructive" : "default"}
                    disabled={equipTitle.isPending}
                    onClick={() =>
                      equipTitle.mutate(equipped ? null : title.key, {
                        onSuccess: () =>
                          showSuccessToast(
                            equipped
                              ? t("progression.toasts.titleRemoved")
                              : t("progression.toasts.titleEquipped")
                          ),
                      })
                    }
                  >
                    {equipped
                      ? t("progression.titleRemove")
                      : t("progression.titleEquip")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
