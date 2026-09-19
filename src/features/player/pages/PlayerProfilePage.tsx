import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Swords, UserCheck, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WinLossBar } from "@/components/win-loss-bar";
import { ProfileBanner } from "@/shared/components/ProfileBanner";
import { PresenceBadge } from "@/shared/components/PresenceBadge";
import { ActivityPanel } from "@/shared/components/ActivityPanel";
import { PageContainer } from "@/features/shell/components/PageContainer";
import { MatchList } from "@/features/topic/components/MatchList";
import { ThemePickerDialog } from "@/features/challenges/components/ThemePickerDialog";
import { useCreateChallenge } from "@/features/challenges/hooks/useChallenges";
import { getUserId } from "@/lib/auth";
import { titleForLevel } from "@/shared/utils/level";
import { countryFlag, countryLabel } from "@/shared/utils/country";
import { personColor } from "@/features/people/lib/person-color";
import { useUserGames } from "@/features/topic/hooks/useTopicDetail";
import { usePresence } from "@/shared/hooks/usePresence";
import { useActivity } from "@/shared/hooks/useActivity";
import { usePlayer, useFollowState, useToggleUserFollow } from "../hooks/usePlayer";

export function PlayerProfilePage() {
  const { playerId = "" } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const me = getUserId();
  const [challengeOpen, setChallengeOpen] = useState(false);

  const { profile, progression, counts, isLoading, isError } = usePlayer(playerId);
  const followState = useFollowState(playerId);
  const { follow, unfollow } = useToggleUserFollow(playerId);
  const createChallenge = useCreateChallenge();
  const gamesQuery = useUserGames();
  const presence = usePresence(playerId);
  const activity = useActivity(playerId);

  if (isLoading) {
    return (
      <PageContainer>
        <p className="text-sm text-muted-foreground">Chargement du joueur…</p>
      </PageContainer>
    );
  }

  if (isError || !profile) {
    return (
      <PageContainer>
        <Card className="items-center gap-3 py-12 text-center">
          <div className="text-base font-semibold">Joueur introuvable</div>
          <Button variant="outline" onClick={() => navigate("/people")}>
            Retour aux personnes
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const name = profile.displayName ?? "Joueur";
  const level = progression?.level ?? 1;
  const duel = progression?.duelStats;
  const played = duel?.played ?? 0;
  const wins = duel?.wins ?? 0;
  const losses = duel?.losses ?? 0;
  const draws = Math.max(0, played - wins - losses);

  const followRecord = followState.data;
  const isFollowing = !!followRecord;
  const pending = follow.isPending || unfollow.isPending;
  const isSelf = me === playerId;

  const versus = (gamesQuery.data ?? []).filter(
    (game) =>
      (game.player1Id === me && game.player2Id === playerId) ||
      (game.player2Id === me && game.player1Id === playerId),
  );

  async function onToggleFollow() {
    if (isFollowing && followRecord) {
      await unfollow.mutateAsync(followRecord.followId);
    } else {
      await follow.mutateAsync();
    }
  }

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{ color: personColor(playerId), glow: personColor(playerId) }}
        badge={isFollowing ? <Badge variant="secondary">Abonné</Badge> : undefined}
        meta={`${progression?.title ?? titleForLevel(level)} · Niveau ${level}${
          profile.country
            ? ` · ${countryFlag(profile.country)} ${countryLabel(profile.country)}`
            : ""
        }`}
        extra={<PresenceBadge online={presence.data?.online ?? false} lastSeenAt={presence.data?.lastSeenAt} />}
        actions={
          isSelf ? (
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => navigate("/profile")}
            >
              Mon profil
            </Button>
          ) : (
            <>
              <Button
                size="lg"
                className="w-full whitespace-nowrap"
                onClick={() => setChallengeOpen(true)}
              >
                <Swords /> Défier
              </Button>
              <Button
                variant={isFollowing ? "secondary" : "outline"}
                size="lg"
                className="w-full"
                onClick={onToggleFollow}
                disabled={pending}
                aria-label={isFollowing ? "Ne plus suivre" : "Suivre"}
              >
                {isFollowing ? (
                  <UserCheck className="text-primary" />
                ) : (
                  <UserPlus />
                )}
                {isFollowing ? "Abonné" : "Suivre"}
              </Button>
            </>
          )
        }
        stats={[
          { label: "Parties", value: played },
          { label: "Abonnés", value: counts?.followers ?? 0 },
          { label: "Abonné à", value: counts?.following ?? 0 },
        ]}
      />

      <PageContainer>
        <section className="mb-6">
          <h2 className="mb-3 font-heading text-base font-semibold">Statistiques</h2>
          <WinLossBar wins={wins} draws={draws} losses={losses} />
        </section>

        <ActivityPanel activity={activity.data} isLoading={activity.isLoading} />

        <h2 className="mb-3 font-heading text-base font-semibold">
          Tes duels contre {name.split(" ")[0]}
        </h2>
        {versus.length === 0 ? (
          <Card size="sm" className="gap-0 py-4">
            <CardContent className="flex items-center gap-3 px-4 text-sm text-muted-foreground">
              <Swords className="size-4" />
              Aucun duel commun pour l'instant. Lance-lui un défi !
            </CardContent>
          </Card>
        ) : (
          <MatchList games={versus} />
        )}
      </PageContainer>

      <ThemePickerDialog
        open={challengeOpen}
        onClose={() => setChallengeOpen(false)}
        opponentName={name}
        onSelect={(topicId) => {
          setChallengeOpen(false);
          createChallenge.mutate({ challengedId: playerId, topicId });
        }}
      />
    </>
  );
}
