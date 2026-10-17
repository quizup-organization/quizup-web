import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Swords, UserCheck, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"

import { WinLossBar } from "@/shared/components/win-loss-bar"
import { hasWinLossResults } from "@/shared/utils/win-loss"
import { ProfileBanner } from "../components/ProfileBanner"
import { PresenceBadge } from "@/shared/components/PresenceBadge"
import { PageHeaderBar } from "@/shared/components/page-header-bar"
import { PageContainer } from "@/features/shell"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/motion/tabs"
import {
  BadgeCollectionSection,
  useBadgeCollection,
} from "@/features/progression"
import { useUrlParam } from "@/shared/hooks/useUrlParam"
import { TopicsPlayedSection } from "@/features/account"
import { EmptyState } from "@/shared/components/empty-state"
import { GameHistorySection } from "@/features/player"
import { ThemePickerDialog } from "@/features/game"
import { useCreateChallenge } from "@/features/challenges"
import { getSessionUserId as getUserId } from "@/features/auth"
import {
  TitleRibbon,
  useEquippedTitle,
  useEquippedTitleLabel,
  usePlayerTitles,
} from "@/features/progression"
import { countryFlag, countryLabel } from "@/shared/utils/country"
import { useLocale } from "@/lib/i18n/useLocale"
import { usePresence } from "@/shared/hooks/usePresence"
import { usePlayerProfile, useToggleUserFollow } from "../hooks/usePlayer"

export function PlayerProfilePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { playerId = "" } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const me = getUserId()
  const [salonOpen, setSalonOpen] = useState(false)
  const [tab, setTab] = useUrlParam<string>("tab", "parties")
  const collection = useBadgeCollection(playerId)

  const { data: profile, isLoading, isError } = usePlayerProfile(playerId)
  const { toggle: toggleFollow } = useToggleUserFollow(playerId)
  const createChallenge = useCreateChallenge()
  const presence = usePresence(playerId)
  // Titre **porté** du joueur consulté (libellé composé : grade traduit + nom du sujet) ; repli sur
  // le titre de compte transitoire tant qu'il n'en affiche aucun.
  const titles = usePlayerTitles(playerId)
  const equippedTitle = useEquippedTitle(titles.data)
  const equippedTitleLabel = useEquippedTitleLabel(titles.data)

  // Une seule page « soi » : `/players/<monId>` redirige vers `/profile`.
  if (profile?.isMe) {
    return <Navigate to="/profile" replace />
  }

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">
          {t("player.profile.loading")}
        </p>
      </PageContainer>
    )
  }

  if (isError || !profile) {
    return (
      <PageContainer>
        <EmptyState title={t("player.profile.notFound")}>
          <Button variant="outline" onClick={() => void navigate("/social")}>
            {t("player.profile.backToSocial")}
          </Button>
        </EmptyState>
      </PageContainer>
    )
  }

  const name = profile.pseudonym ?? t("player.profile.fallbackName")
  const level = profile.progression.level

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{
          userId: playerId,
          avatarOptions: profile.avatarOptions ?? undefined,
        }}
        bannerUrl={profile.bannerUrl}
        titleRibbon={
          equippedTitleLabel && equippedTitle ? (
            <TitleRibbon label={equippedTitleLabel} rank={equippedTitle.rank} />
          ) : undefined
        }
        meta={`${
          equippedTitleLabel
            ? t("player.profile.level", { level })
            : t("player.profile.meta", {
                title: profile.progression.title,
                level,
              })
        }${
          profile.country
            ? ` · ${countryFlag(profile.country)} ${countryLabel(profile.country, locale)}`
            : ""
        }`}
        extra={
          <PresenceBadge
            online={presence.data?.status === "ONLINE"}
            lastSeenAt={presence.data?.lastSeenAt}
          />
        }
        actions={
          <>
            <Button
              size="lg"
              className="w-full whitespace-nowrap"
              onClick={() => setSalonOpen(true)}
            >
              <Swords /> {t("player.profile.challenge")}
            </Button>
            <Button
              variant={profile.following ? "secondary" : "outline"}
              size="lg"
              className="w-full"
              onClick={toggleFollow}
              aria-pressed={profile.following}
              aria-label={
                profile.following
                  ? t("player.profile.unfollowAria")
                  : t("player.profile.followAria")
              }
            >
              {profile.following ? (
                <UserCheck className="text-primary" />
              ) : (
                <UserPlus />
              )}
              {profile.following
                ? t("player.profile.following")
                : t("player.profile.follow")}
            </Button>
          </>
        }
        stats={[
          {
            label: t("player.profile.stats.played"),
            value: profile.stats.played,
          },
          {
            label: t("player.profile.stats.followers"),
            value: profile.followersCount,
          },
          {
            label: t("player.profile.stats.following"),
            value: profile.followingCount,
          },
        ]}
        belowStats={
          hasWinLossResults(profile.stats) ? (
            <WinLossBar
              wins={profile.stats.wins}
              draws={profile.stats.draws}
              losses={profile.stats.losses}
            />
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <PageHeaderBar>
          <TabsList>
            <TabsTrigger value="parties">
              {t("shell.profile.tabs.parties")}
            </TabsTrigger>
            <TabsTrigger value="stats">
              {t("shell.profile.tabs.stats")}
            </TabsTrigger>
            <TabsTrigger value="badges">
              {t("shell.profile.tabs.badges")}
            </TabsTrigger>
          </TabsList>
        </PageHeaderBar>

        <TabsContent value="parties" className="mt-0">
          <GameHistorySection
            userId={playerId}
            opponentId={me ?? undefined}
            empty={
              <EmptyState
                icon={<Swords className="size-6 text-muted-foreground" />}
                title={t("player.profile.emptyTitle")}
                description={t("player.profile.emptyDescription")}
              >
                <Button onClick={() => setSalonOpen(true)}>
                  <Swords /> {t("player.profile.challenge")}
                </Button>
              </EmptyState>
            }
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-0">
          <PageContainer>
            {profile.stats.played === 0 ? (
              <EmptyState
                icon={<Swords className="size-6 text-muted-foreground" />}
                title={t("player.profile.emptyTitle")}
                description={t("player.profile.emptyDescription")}
              >
                <Button onClick={() => void navigate("/social")}>
                  <Swords /> {t("player.profile.challenge")}
                </Button>
              </EmptyState>
            ) : (
              <TopicsPlayedSection userId={playerId} />
            )}
          </PageContainer>
        </TabsContent>

        <TabsContent value="badges" className="mt-0">
          <BadgeCollectionSection collection={collection.data} />
        </TabsContent>
      </Tabs>

      <ThemePickerDialog
        open={salonOpen}
        onClose={() => setSalonOpen(false)}
        title={t("player.profile.challengeTitle", { name })}
        sub={t("player.profile.challengeSub")}
        onSelect={(topicId) => {
          setSalonOpen(false)
          createChallenge.mutate({ topicId, opponentId: profile.userId })
        }}
      />
    </>
  )
}
