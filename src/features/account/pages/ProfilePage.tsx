import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil, Share2, Swords } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/shared/components/empty-state"
import { ProgressBanner } from "@/shared/components/progress-banner"
import { WinLossBar } from "@/shared/components/win-loss-bar"
import { hasWinLossResults } from "@/shared/utils/win-loss"
import {
  ProfileBanner,
  ProfileShareDialog,
  useGameHistory,
} from "@/features/player"
import { PageContainer, useMe } from "@/features/shell"
import { MatchList } from "@/features/player"
import { countryFlag, countryLabel } from "@/shared/utils/country"
import { useLocale } from "@/lib/i18n/useLocale"
import { TopicsPlayedSection } from "../components/TopicsPlayedSection"

export function ProfilePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const navigate = useNavigate()
  const meQuery = useMe()
  const userId = meQuery.userId
  const [shareOpen, setShareOpen] = useState(false)

  // Historique des duels : aperçu limité aux 5 dernières parties (la page dédiée « historique
  // complet » viendra plus tard pour en charger davantage).
  const history = useGameHistory(userId ?? "")

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
        bannerUrl={profile?.bannerUrl ?? null}
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
        aboveStats={
          /* Niveau matérialisé par la même barre que « questions complétées » des fiches thème :
             pourcentage du niveau courant + XP restante avant le suivant — au-dessus des stats. */
          <ProgressBanner
            label={t("shell.profile.level", { level })}
            value={profile?.progression.levelProgressPercent ?? 0}
            detail={
              profile
                ? t("shell.profile.levelDetail", {
                    remaining: Math.max(
                      0,
                      profile.progression.xpForNextLevel -
                        profile.progression.xpTotal
                    ),
                    next: level + 1,
                  })
                : undefined
            }
          />
        }
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
        <TopicsPlayedSection userId={userId ?? ""} />

        <h2 className="mb-4 font-heading text-base font-semibold">
          {t("shell.profile.historyTitle")}
        </h2>

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
          <MatchList items={shown} />
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
