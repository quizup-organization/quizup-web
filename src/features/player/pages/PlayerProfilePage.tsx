import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Swords, UserCheck, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { WinLossBar } from "@/shared/components/win-loss-bar"
import { hasWinLossResults } from "@/shared/utils/win-loss"
import { ProfileBanner } from "../components/ProfileBanner"
import { PresenceBadge } from "@/shared/components/PresenceBadge"
import { PageContainer } from "@/features/shell"
import { MatchList } from "../components/MatchList"
import { ThemePickerDialog } from "@/features/game"
import { useCreateChallenge } from "@/features/challenges"
import { getSessionUserId as getUserId } from "@/features/auth"
import {
  useEquippedTitleLabel,
  usePlayerTitles,
} from "@/features/progression"
import { countryFlag, countryLabel } from "@/shared/utils/country"
import { useLocale } from "@/lib/i18n/useLocale"
import { usePresence } from "@/shared/hooks/usePresence"
import {
  useGameHistory,
  usePlayerProfile,
  useToggleUserFollow,
} from "../hooks/usePlayer"

export function PlayerProfilePage() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { playerId = "" } = useParams<{ playerId: string }>()
  const navigate = useNavigate()
  const me = getUserId()
  const [salonOpen, setSalonOpen] = useState(false)

  const { data: profile, isLoading, isError } = usePlayerProfile(playerId)
  const { toggle: toggleFollow } = useToggleUserFollow(playerId)
  const createChallenge = useCreateChallenge()
  // Tes duels contre ce joueur : aperçu limité aux 5 derniers.
  const versusHistory = useGameHistory(me ?? "", { opponentId: playerId })
  const presence = usePresence(playerId)
  // Titre **porté** du joueur consulté (libellé composé : grade traduit + nom du sujet) ; repli sur
  // le titre de compte transitoire tant qu'il n'en affiche aucun.
  const titles = usePlayerTitles(playerId)
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
        <Card className="items-center gap-3 py-12 text-center">
          <div className="text-base font-semibold">
            {t("player.profile.notFound")}
          </div>
          <Button variant="outline" onClick={() => void navigate("/people")}>
            {t("player.profile.backToPeople")}
          </Button>
        </Card>
      </PageContainer>
    )
  }

  const name = profile.pseudonym ?? t("player.profile.fallbackName")
  const level = profile.progression.level
  const versus = versusHistory.items

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{
          userId: playerId,
          avatarOptions: profile.avatarOptions ?? undefined,
        }}
        bannerUrl={profile.bannerUrl}
        meta={`${t("player.profile.meta", {
          title: equippedTitleLabel ?? profile.progression.title,
          level,
        })}${
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

      <PageContainer>
        {versus.length > 0 && (
          <>
            <h2 className="mb-3 font-heading text-base font-semibold">
              {t("player.profile.versusTitle", { name: name.split(" ")[0] })}
            </h2>
            <MatchList items={versus} />
          </>
        )}
      </PageContainer>

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
