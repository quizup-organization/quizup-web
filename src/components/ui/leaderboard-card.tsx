import * as React from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n/useLocale"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LeaderboardPodium,
  type LeaderboardRanking as LeaderboardPodiumRanking,
} from "@/components/ui/leaderboard-podium"
import {
  LeaderboardRankings,
  type LeaderboardRankingItem,
} from "@/components/ui/leaderboard-rankings"

interface LeaderboardRunOption {
  id: string
  label: string
}

interface LeaderboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  /** Sous-titre libre (prioritaire sur la plage de dates). */
  subtitle?: string
  fromDate: string | Date
  toDate: string | Date
  podiumRankings: LeaderboardPodiumRanking[]
  rankings: LeaderboardRankingItem[]
  currentUserId?: string
  /** Pagination client (10/25/50/100 + navigation) ; `false` = liste complète rendue d'un bloc. */
  showPagination?: boolean
  runOptions?: LeaderboardRunOption[]
  selectedRunId?: string
  onRunChange?: (runId: string) => void
  onUserClick?: (ranking: LeaderboardRankingItem) => void
}

function formatRangeDate(date: string | Date, locale: string) {
  const parsed = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(parsed.getTime())) return ""

  return parsed.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const LeaderboardCard = React.forwardRef<HTMLDivElement, LeaderboardCardProps>(
  (
    {
      className,
      title,
      subtitle,
      fromDate,
      toDate,
      podiumRankings,
      rankings,
      currentUserId,
      showPagination = true,
      runOptions,
      selectedRunId,
      onRunChange,
      onUserClick,
      ...props
    },
    ref
  ) => {
    const { t } = useTranslation()
    const locale = useLocale()
    const fromLabel = formatRangeDate(fromDate, locale)
    const toLabel = formatRangeDate(toDate, locale)
    const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? ""
    const hasOnRunChange = Boolean(onRunChange)
    const [localRunId, setLocalRunId] = React.useState(resolvedRunId)

    React.useEffect(() => {
      if (hasOnRunChange) return
      setLocalRunId(resolvedRunId)
    }, [hasOnRunChange, resolvedRunId])

    const activeRunId = hasOnRunChange ? resolvedRunId : localRunId

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl border bg-card p-4 shadow-sm tablet-up:p-6",
          className
        )}
        {...props}
      >
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">
              {title ?? t("shared.leaderboard.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {subtitle ?? `${fromLabel} - ${toLabel}`}
            </p>
          </div>

          {runOptions && runOptions.length > 0 ? (
            <Select
              value={activeRunId}
              onValueChange={(value) => {
                if (!value) return
                if (onRunChange) {
                  onRunChange(value)
                  return
                }
                setLocalRunId(value)
              }}
            >
              <SelectTrigger
                size="sm"
                aria-label={t("shared.leaderboard.periodAria")}
                className="max-w-full"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {runOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
        </div>

        <LeaderboardPodium
          rankings={podiumRankings}
          className="mb-6"
          onUserClick={onUserClick}
        />

        <LeaderboardRankings
          rankings={rankings}
          currentUserId={currentUserId}
          onUserClick={onUserClick}
          showPagination={showPagination}
          defaultPageSize={10}
        />
      </div>
    )
  }
)

LeaderboardCard.displayName = "LeaderboardCard"

export { LeaderboardCard }
export type { LeaderboardCardProps, LeaderboardRunOption }
