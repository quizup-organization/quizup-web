import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TopicIcon } from "@/shared/components/topic-icon";
import { UserAvatar } from "@/shared/components/user-avatar";
import { getSessionUserId } from "@/features/auth";
import {
  challengesService,
  useAcceptChallenge,
  useDeclineChallenge,
  useMyChallenges,
  useMyOpenRooms,
  type ChallengeView,
  type RoomView,
} from "@/features/game";
import { useResolveChallenge } from "@/features/notifications";
import { queryKeys } from "@/lib/query-keys";
import { useTopicName } from "@/features/shell";
import { SectionHeader } from "./section-header";

type PendingDuel =
  | {
      kind: "received";
      id: string;
      topic: ChallengeView["topic"];
      player: ChallengeView["challenger"];
    }
  | {
      kind: "room";
      id: string;
      topic: RoomView["topic"];
      player: RoomView["opponent"];
    }
  | {
      kind: "sent";
      id: string;
      topic: ChallengeView["topic"];
      player: ChallengeView["opponent"];
    };

function contextLabel(item: PendingDuel): string {
  const name = item.player?.pseudonym ?? "un joueur";
  switch (item.kind) {
    case "received":
      return `Défi reçu de ${name}`;
    case "sent":
      return `Défi envoyé à ${name}`;
    case "room":
      return item.player ? `Salon ouvert · ${name}` : "Salon ouvert · en attente";
  }
}

/** Bandeau horizontal scrollable d'éléments en attente (même style que les carrousels de sujets). */
function PendingRow({ items }: { items: PendingDuel[] }) {
  const navigate = useNavigate();
  const resolveName = useTopicName();
  const queryClient = useQueryClient();
  const acceptChallenge = useAcceptChallenge();
  const declineChallenge = useDeclineChallenge();
  const resolveChallenge = useResolveChallenge();
  const cancelChallenge = useMutation({
    mutationFn: (challengeId: string) => challengesService.cancel(challengeId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() }),
  });

  /** Accepter depuis l'accueil : salle créée par la saga → on y entre directement. */
  async function onAccept(challengeId: string) {
    let roomId: string | null = null;
    try {
      roomId = await acceptChallenge.accept(challengeId);
    } catch {
      // Défi expiré/purgé : on réconcilie quand même l'inbox.
    }
    resolveChallenge(challengeId);
    navigate(roomId ? `/rooms/${roomId}` : "/notifications");
  }

  async function onDecline(challengeId: string) {
    await declineChallenge.decline(challengeId).catch(() => undefined);
    resolveChallenge(challengeId);
  }

  return (
    <div className="qu-scroll-x flex scroll-fade-x gap-3 overflow-x-auto pb-1">
      {items.map((item) => (
        <Card
          key={`${item.kind}-${item.id}`}
          size="sm"
          className="w-56 shrink-0 gap-2 py-3 tablet-up:w-60"
        >
          <CardContent className="flex flex-col gap-2.5 px-3">
            <div className="flex min-w-0 items-center gap-2">
              <TopicIcon topic={item.topic} size={32} />
              <span className="truncate text-sm font-semibold">
                {resolveName(item.topic.names)}
              </span>
            </div>
            <div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
              {item.player?.userId ? (
                <Link
                  to={`/players/${item.player.userId}`}
                  aria-label={`Voir le profil de ${item.player.pseudonym ?? "Joueur"}`}
                  className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <UserAvatar
                    name={item.player.pseudonym ?? "Joueur"}
                    userId={item.player.userId}
                    avatarOptions={item.player.avatarOptions ?? undefined}
                    size={20}
                  />
                </Link>
              ) : (
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted">
                  <Clock size={11} aria-hidden />
                </span>
              )}
              <span className="truncate">{contextLabel(item)}</span>
            </div>
            {item.kind === "received" && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="flex-1"
                  disabled={declineChallenge.pending}
                  onClick={() => void onDecline(item.id)}
                >
                  Refuser
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  disabled={acceptChallenge.pending}
                  onClick={() => void onAccept(item.id)}
                >
                  Accepter
                </Button>
              </div>
            )}
            {item.kind === "room" && (
              <Button size="sm" onClick={() => navigate(`/rooms/${item.id}`)}>
                Ouvrir la salle
              </Button>
            )}
            {item.kind === "sent" && (
              <Button
                size="sm"
                variant="destructive"
                disabled={cancelChallenge.isPending}
                onClick={() => cancelChallenge.mutate(item.id)}
              >
                Annuler
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Sections « Tes défis en attente » (invitations reçues + défis envoyés) et
 * « Tes salons en attente » (salons ouverts) de l'Accueil, dissociées et en bandeaux
 * horizontaux scrollables. Chaque section est masquée s'il n'y a rien.
 */
export function PendingDuelsSection() {
  const me = getSessionUserId();
  const challenges = useMyChallenges();
  const openRooms = useMyOpenRooms();

  const { duels, salons } = useMemo(() => {
    const pending = (challenges.data ?? []).filter(
      (challenge) => challenge.status === "PENDING",
    );
    const received: PendingDuel[] = pending
      .filter((challenge) => challenge.opponent?.userId === me)
      .map((challenge) => ({
        kind: "received",
        id: challenge.challengeId,
        topic: challenge.topic,
        player: challenge.challenger,
      }));
    const sent: PendingDuel[] = pending
      .filter((challenge) => challenge.challenger?.userId === me)
      .map((challenge) => ({
        kind: "sent",
        id: challenge.challengeId,
        topic: challenge.topic,
        player: challenge.opponent,
      }));
    const rooms: PendingDuel[] = (openRooms.data ?? []).map((room) => ({
      kind: "room",
      id: room.roomId,
      topic: room.topic,
      player: room.opponent,
    }));
    return { duels: [...received, ...sent], salons: rooms };
  }, [challenges.data, openRooms.data, me]);

  if (duels.length === 0 && salons.length === 0) return null;

  return (
    <>
      {duels.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Tes défis en attente" />
          <PendingRow items={duels} />
        </section>
      )}
      {salons.length > 0 && (
        <section className="mb-8">
          <SectionHeader title="Tes salons en attente" />
          <PendingRow items={salons} />
        </section>
      )}
    </>
  );
}
