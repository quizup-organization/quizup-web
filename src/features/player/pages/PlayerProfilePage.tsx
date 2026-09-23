import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Swords, UserCheck, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { WinLossBar } from "@/shared/components/win-loss-bar";
import { ProfileBanner } from "../components/ProfileBanner";
import { PresenceBadge } from "@/shared/components/PresenceBadge";
import { PageContainer } from "@/features/shell";
import { MatchList } from "@/features/topic";
import { ThemePickerDialog } from "@/features/challenges";
import { useCreateChallenge } from "@/features/challenges";
import { getSessionUserId as getUserId } from "@/features/auth";
import { titleForLevel } from "@/shared/utils/level";
import { countryFlag, countryLabel } from "@/shared/utils/country";
import { useUserGames } from "@/features/topic";
import { usePresence } from "@/shared/hooks/usePresence";
import { usePlayer, useFollowState, useToggleUserFollow } from "../hooks/usePlayer";

export function PlayerProfilePage() {
  const { playerId = "" } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const me = getUserId();
  const isSelf = me === playerId;
  const [challengeOpen, setChallengeOpen] = useState(false);

  const { profile, progression, counts, isLoading, isError } = usePlayer(playerId);
  const followState = useFollowState(playerId);
  const { toggle: toggleFollow } = useToggleUserFollow(playerId);
  const createChallenge = useCreateChallenge();
  const gamesQuery = useUserGames();
  const presence = usePresence(playerId);

  // Une seule page « soi » : `/players/<monId>` redirige vers `/profile`.
  if (isSelf) {
    return <Navigate to="/profile" replace />;
  }

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

  const versus = (gamesQuery.data ?? []).filter(
    (game) =>
      (game.player1Id === me && game.player2Id === playerId) ||
      (game.player2Id === me && game.player1Id === playerId),
  );

  // Bilan tête-à-tête : sur la fiche d'un **autre** joueur, on n'affiche pas ses stats
  // globales mais notre ratio contre lui (calculé depuis les duels communs terminés).
  const headToHead = versus.reduce(
    (acc, game) => {
      if (game.status !== "FINISHED") return acc;
      if (game.winnerId == null) acc.draws += 1;
      else if (game.winnerId === me) acc.wins += 1;
      else acc.losses += 1;
      return acc;
    },
    { wins: 0, draws: 0, losses: 0 },
  );
  const stats = isSelf ? { wins, draws, losses } : headToHead;
  const hasHeadToHead =
    headToHead.wins + headToHead.draws + headToHead.losses > 0;

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{
          userId: playerId,
          avatarOptions: profile.avatarOptions,
        }}
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
                onClick={toggleFollow}
                aria-pressed={isFollowing}
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
          <h2 className="mb-3 font-heading text-base font-semibold">
            {isSelf ? "Statistiques" : `Ton bilan contre ${name.split(" ")[0]}`}
          </h2>
          <Card size="sm">
            <CardContent className="px-4 py-4">
              {isSelf || hasHeadToHead ? (
                <WinLossBar wins={stats.wins} draws={stats.draws} losses={stats.losses} />
              ) : (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Swords className="size-4" />
                  Aucun duel commun pour l'instant. Lance-lui un défi !
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {versus.length > 0 && (
          <>
            <h2 className="mb-3 font-heading text-base font-semibold">
              Tes duels contre {name.split(" ")[0]}
            </h2>
            <MatchList games={versus} />
          </>
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
