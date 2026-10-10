import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CloseButton } from "@/shared/components/close-button";
import { useTopicOverview } from "@/features/topic";
import { usePlayerProfile } from "@/features/player";
import { useMe, useTopicName } from "@/features/shell";
import { TOKEN } from "@/shared/theme/tokens";
import { useGoBack } from "@/shared/hooks/useGoBack";
import { RoomInvite } from "../components/RoomInvite";
import { RoomWaitingScreen } from "../components/RoomWaitingScreen";
import { getSessionUserId } from "@/features/auth";
import { useRoom } from "../hooks/useRoom";
import { useLeaveRoom, useRoomJoin } from "../hooks/useRooms";

/**
 * Salle d'attente d'une salle — reprend le langage visuel de la file de matchmaking
 * (fond duel, trame de points, anneaux de ping, sujet en pied d'écran). Dès que la partie
 * est créée, la salle redirige vers l'arène.
 */
export function RoomPage() {
  const { roomId = "" } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { room, isLoading, isError } = useRoom(roomId);
  const leave = useLeaveRoom(roomId);
  const cancel = useLeaveRoom(roomId, true);
  const goBack = useGoBack("/notifications");
  const topicQuery = useTopicOverview(room.topicId ?? "");
  const { data: me } = useMe();
  const resolveName = useTopicName();
  const meId = getSessionUserId();
  const meIsInitiator = room.initiatorId === meId;
  const opponentId = meIsInitiator
    ? (room.participantId ?? room.opponentId)
    : room.initiatorId;
  const opponent = usePlayerProfile(opponentId ?? "");

  // Apparition client-driven : la commande unique porte présence + enregistrement du participant.
  useRoomJoin(roomId);

  useEffect(() => {
    if (room.gameId) {
      navigate(`/game/${room.gameId}`, { replace: true });
    }
  }, [room.gameId, navigate]);

  if (room.status === "CLOSED" || room.status === "FAILED" || isError) {
    const title =
      room.outcome === "EXPIRED"
        ? "Salon expiré"
        : room.outcome === "FAILED"
          ? "Partie impossible à créer"
          : room.outcome === "CANCELLED"
            ? "Salon annulé"
            : "Salon introuvable";
    return (
      <div
        className="grid h-full place-items-center p-6"
        style={{ background: TOKEN.duelBg }}
      >
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="text-lg font-heading font-bold">{title}</div>
          <Button className="w-full" onClick={goBack}>
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading && !room.topicId) {
    return (
      <div
        className="grid h-full place-items-center p-6 text-sm"
        style={{ background: TOKEN.duelBg, color: TOKEN.mutedFg }}
      >
        Préparation du salon…
      </div>
    );
  }

  const topic = topicQuery.data?.topic;
  const nominative = room.opponentId !== null;
  const shareUrl = `${window.location.origin}/join/${roomId}`;
  const cancelLabel = nominative ? "Annuler le défi" : "Annuler le salon";

  return (
    <div
      className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      {/* Retour : quitte l'écran sans fermer la salle (seul l'initiateur peut annuler, en pied). */}
      <CloseButton
        onClick={() => leave.mutate()}
        aria-label="Retour (le salon reste ouvert)"
        className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-[18px] z-20"
      />

      <RoomWaitingScreen
        topic={{
          name: resolveName(topic?.names, "Salon privé"),
          emoji: topic?.emoji ?? undefined,
          color: topic?.color ?? undefined,
          imageUrl: topic?.imageUrl ?? undefined,
          category: topic?.category ?? undefined,
          categoryLabel: topic?.categoryLabel ?? undefined,
        }}
        player={{
          name: me?.pseudonym ?? "Toi",
          userId: meId ?? undefined,
          avatarOptions: me?.avatarOptions,
          present: meIsInitiator
            ? room.initiatorPresent
            : room.participantPresent,
          isMe: true,
        }}
        opponent={
          opponentId
            ? {
                name: opponent.data?.pseudonym ?? "Adversaire",
                userId: opponentId,
                avatarOptions: opponent.data?.avatarOptions,
                present: meIsInitiator
                  ? room.participantPresent
                  : room.initiatorPresent,
              }
            : null
        }
        expiresAt={room.expiresAt}
        readyDeadlineAt={room.readyDeadlineAt}
      >
        {/* Partage (salle non nominative) dans le flux ; l'annulation vit en pied de page, centrée.
            Un défi nominatif n'a pas de partage social : la salle reste sur une colonne centrée. */}
        {!nominative && (
          <div className="flex w-full max-w-[380px] flex-col items-center gap-4">
            <RoomInvite
              shareUrl={shareUrl}
              topicName={topic ? resolveName(topic.names) : undefined}
            />
          </div>
        )}
      </RoomWaitingScreen>

      {/* Pied centré : hors colonnes, toujours visible (initiateur seulement). */}
      {meIsInitiator && (
        <div className="relative z-10 flex shrink-0 justify-center px-6 pt-1 pb-4">
          <Button
            variant="destructive"
            className="w-full max-w-[380px]"
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
          >
            {cancelLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
