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
import { ThemePickerDialog, useCreateChallenge } from "@/features/challenges";
import { getSessionUserId as getUserId } from "@/features/auth";
import { countryFlag, countryLabel } from "@/shared/utils/country";
import { usePresence } from "@/shared/hooks/usePresence";
import {
  useHeadToHead,
  usePlayerProfile,
  useProfileGames,
  useToggleUserFollow,
} from "../hooks/usePlayer";

export function PlayerProfilePage() {
  const { playerId = "" } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const me = getUserId();
  const [challengeOpen, setChallengeOpen] = useState(false);

  const { data: profile, isLoading, isError } = usePlayerProfile(playerId);
  const { toggle: toggleFollow } = useToggleUserFollow(playerId);
  const createChallenge = useCreateChallenge();
  const headToHead = useHeadToHead(me ?? "", playerId);
  const gamesQuery = useProfileGames(me ?? "", {
    opponentId: playerId,
    page: 0,
    size: 100,
  });
  const presence = usePresence(playerId);

  // Une seule page « soi » : `/players/<monId>` redirige vers `/profile`.
  if (profile?.isMe) {
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
  const level = profile.progression.level;
  const versus = gamesQuery.data?.content ?? [];
  const stats = headToHead.data;
  const hasHeadToHead = (stats?.played ?? 0) > 0;

  return (
    <>
      <ProfileBanner
        name={name}
        avatar={{
          userId: playerId,
          avatarOptions: profile.avatarOptions ?? undefined,
        }}
        badge={
          profile.following ? <Badge variant="secondary">Abonné</Badge> : undefined
        }
        meta={`${profile.progression.title} · Niveau ${level}${
          profile.country
            ? ` · ${countryFlag(profile.country)} ${countryLabel(profile.country)}`
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
              onClick={() => setChallengeOpen(true)}
            >
              <Swords /> Défier
            </Button>
            <Button
              variant={profile.following ? "secondary" : "outline"}
              size="lg"
              className="w-full"
              onClick={toggleFollow}
              aria-pressed={profile.following}
              aria-label={profile.following ? "Ne plus suivre" : "Suivre"}
            >
              {profile.following ? (
                <UserCheck className="text-primary" />
              ) : (
                <UserPlus />
              )}
              {profile.following ? "Abonné" : "Suivre"}
            </Button>
          </>
        }
        stats={[
          { label: "Parties", value: profile.stats.played },
          { label: "Abonnés", value: profile.followersCount },
          { label: "Abonné à", value: profile.followingCount },
        ]}
      />

      <PageContainer>
        <section className="mb-6">
          <h2 className="mb-3 font-heading text-base font-semibold">
            {`Ton bilan contre ${name.split(" ")[0]}`}
          </h2>
          <Card size="sm">
            <CardContent className="px-4 py-4">
              {hasHeadToHead && stats ? (
                <WinLossBar
                  wins={stats.wins}
                  draws={stats.draws}
                  losses={stats.losses}
                />
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
            <MatchList items={versus} />
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
