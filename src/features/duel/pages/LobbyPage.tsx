import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTopicOverview } from "@/features/topic";
import { usePlayerProfile } from "@/features/player";
import { TOKEN } from "@/shared/theme/tokens";
import { useGoBack } from "@/shared/hooks/useGoBack";
import { LobbyShareCard } from "../components/LobbyShareCard";
import { LobbyWaitingScreen } from "../components/LobbyWaitingScreen";
import { getSessionUserId } from "@/features/auth";
import { useLobby } from "../hooks/useLobby";
import { useLeaveLobby, useLobbyEnter } from "../hooks/useLobbies";

/**
 * Salle d'attente d'un salon privé — reprend le langage visuel de la file de matchmaking
 * (fond duel, trame de points, anneaux de ping, sujet en pied d'écran). Dès que le second
 * joueur a rejoint, la partie est créée et redirige vers l'arène.
 */
export function LobbyPage() {
  const { lobbyId = "" } = useParams<{ lobbyId: string }>();
  const navigate = useNavigate();
  const { lobby, isLoading, isError } = useLobby(lobbyId);
  const leave = useLeaveLobby(lobbyId);
  const cancel = useLeaveLobby(lobbyId, true);
  const goBack = useGoBack("/notifications");
  const topicQuery = useTopicOverview(lobby.topicId ?? "");
  const opponent = usePlayerProfile(lobby.opponentId ?? "");

  useLobbyEnter(lobbyId);

  useEffect(() => {
    if (lobby.gameId) {
      navigate(`/duel/${lobby.gameId}`, { replace: true });
    }
  }, [lobby.gameId, navigate]);

  if (lobby.status === "CLOSED" || lobby.status === "FAILED" || isError) {
    const me = getSessionUserId();
    const title =
      lobby.outcome === "MISSED"
        ? lobby.absentPlayerId && lobby.absentPlayerId === me
          ? "Tu ne t'es pas présenté à temps"
          : "Ton adversaire ne s'est pas présenté"
        : lobby.outcome === "EXPIRED"
          ? "Salon expiré"
          : lobby.outcome === "FAILED"
            ? "Partie impossible à créer"
            : lobby.outcome === "DECLINED"
              ? "Défi refusé"
              : lobby.outcome === "CANCELLED"
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

  if (isLoading && !lobby.topicId) {
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
  const nominative = lobby.opponentId !== null;
  const shareUrl = `${window.location.origin}/join/${lobbyId}`;

  return (
    <div
      className="qu-immersive-safe relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <button
        onClick={() => leave.mutate()}
        aria-label="Quitter le salon"
        className="qu-hoverable absolute top-[calc(1rem+env(safe-area-inset-top))] right-[18px] z-20 flex size-[34px] items-center justify-center rounded-md border border-border bg-foreground/5 text-muted-foreground"
      >
        <X size={16} />
      </button>

      <LobbyWaitingScreen
        topic={{
          name: topic?.name ?? "Salon privé",
          emoji: topic?.emoji ?? undefined,
          color: topic?.color ?? undefined,
          imageUrl: topic?.imageUrl ?? undefined,
          category: topic?.category ?? undefined,
          categoryLabel: topic?.categoryLabel ?? undefined,
        }}
        nominative={nominative}
        opponent={
          nominative
            ? {
                userId: lobby.opponentId ?? "",
                pseudonym: opponent.data?.pseudonym,
                avatarOptions: opponent.data?.avatarOptions,
              }
            : null
        }
        expiresAt={lobby.expiresAt}
        readyDeadlineAt={lobby.readyDeadlineAt}
      >
        {!nominative && (
          <LobbyShareCard shareUrl={shareUrl} topicName={topic?.name} />
        )}
      </LobbyWaitingScreen>

      <div className="relative flex justify-center pb-6">
        <Button
          variant="outline"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
        >
          Annuler {nominative ? "le défi" : "le salon"}
        </Button>
      </div>
    </div>
  );
}
