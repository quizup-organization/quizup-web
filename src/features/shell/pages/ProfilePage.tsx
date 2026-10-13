import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil, Share2, Swords } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { WinLossBar } from "@/shared/components/win-loss-bar"
import { hasWinLossResults } from "@/shared/utils/win-loss"
import {
  ProfileBanner,
  ProfileShareDialog,
  useGameHistory,
  useHistorySentinel,
} from "@/features/player"
import { PageContainer } from "../components/PageContainer"
import { useMe } from "../hooks/useMe"
import { useTopicName } from "../hooks/useTopicName"
import { MatchList } from "@/features/topic"
import { countryFlag, countryLabel } from "@/shared/utils/country"
import { useLocale } from "@/lib/i18n/useLocale"

export function ProfilePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const navigate = useNavigate()
  const meQuery = useMe()
  const resolveName = useTopicName()
  const userId = meQuery.userId
  const [filterTopic, setFilterTopic] = useState("all")
  const [shareOpen, setShareOpen] = useState(false)

  // Historique en scroll infini (5 par page). La requête non filtrée sert aussi de source des
  // options du filtre « Sujet » (elles s'enrichissent en scrollant, gelées pendant un filtre).
  const unfilteredHistory = useGameHistory(userId ?? "")
  const filteredHistory = useGameHistory(userId ?? "", {
    topicId: filterTopic === "all" ? undefined : filterTopic,
  })
  const history = filterTopic === "all" ? unfilteredHistory : filteredHistory
  const sentinelRef = useHistorySentinel(history)

  const historyTopics = useMemo(() => {
    const byId = new Map<string, string>()
    ;[...unfilteredHistory.items, ...filteredHistory.items].forEach((game) => {
      byId.set(game.topic.topicId, resolveName(game.topic.names))
    })
    return [...byId.entries()].map(([topicId, name]) => ({ topicId, name }))
  }, [unfilteredHistory.items, filteredHistory.items, resolveName])

  if (meQuery.isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          {t("shell.profile.loading")}
        </p>
      </PageContainer>
    )
  }

  const profile = meQuery.data
  const name = profile?.pseudonym ?? t("shell.settings.fallbackPlayer")
  const level = profile?.progression.level ?? 1
  const stats = profile?.stats
  const results = {
    wins: stats?.wins ?? 0,
    draws: stats?.draws ?? 0,
    losses: stats?.losses ?? 0,
  }
  const country = countryLabel(profile?.country, locale)
  const shown = history.items
  const meta = `${t("shell.profile.meta", {
    title: profile?.progression.title ?? "",
    level,
  })}${profile?.country ? ` · ${countryFlag(profile.country)} ${country}` : ""}`

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{
          userId: userId ?? undefined,
          avatarOptions: profile?.avatarOptions ?? undefined,
        }}
        onEditAvatar={() => void navigate("/settings/avatar")}
        meta={meta}
        stats={[
          { label: t("shell.profile.stats.games"), value: stats?.played ?? 0 },
          {
            label: t("shell.profile.stats.followers"),
            value: profile?.followersCount ?? 0,
          },
          {
            label: t("shell.profile.stats.following"),
            value: profile?.followingCount ?? 0,
          },
        ]}
        belowStats={
          hasWinLossResults(results) ? <WinLossBar {...results} /> : undefined
        }
        actions={
          <>
            <Button onClick={() => void navigate("/settings")}>
              <Pencil /> {t("shell.profile.edit")}
            </Button>
            <Button variant="outline" onClick={() => setShareOpen(true)}>
              <Share2 /> {t("shell.profile.share")}
            </Button>
          </>
        }
      />

      <PageContainer>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-base font-semibold">
            {t("shell.profile.historyTitle")}
          </h2>
          <div className="flex-1" />
          {historyTopics.length > 1 && (
            <Select
              value={filterTopic}
              onValueChange={(value) => setFilterTopic(String(value))}
            >
              <SelectTrigger
                size="sm"
                className="w-full tablet-up:w-[220px]"
                aria-label={t("shell.profile.historyFilterAria")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("shell.profile.allTopics")}
                </SelectItem>
                {historyTopics.map((topic) => (
                  <SelectItem key={topic.topicId} value={topic.topicId}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {shown.length === 0 ? (
          <EmptyState
            icon={<Swords className="size-6 text-muted-foreground" />}
            title={t("shell.profile.emptyTitle")}
            description={t("shell.profile.emptyDescription")}
          >
            <Button onClick={() => void navigate("/topics")}>
              <Swords /> {t("shell.profile.findOpponent")}
            </Button>
          </EmptyState>
        ) : (
          <>
            <MatchList items={shown} />

            {history.hasNextPage && (
              <div ref={sentinelRef} className="mt-1 h-px" aria-hidden="true" />
            )}

            {history.isFetchingNextPage && (
              <div className="mt-3 h-16 animate-pulse rounded-2xl bg-muted/50" />
            )}
          </>
        )}
      </PageContainer>

      {userId && (
        <ProfileShareDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          userId={userId}
          name={name}
        />
      )}
    </>
  )
}
