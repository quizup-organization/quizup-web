import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@heroui/react";
import { useTopicOverview } from "@/features/topic";
import { TOKEN } from "@/shared/theme/tokens";
import { SearchingScreen } from "../components/SearchingScreen";
import { useCancelMatchmaking } from "../hooks/useMatchmaking";
import { useTicket } from "../hooks/useTicket";

/**
 * Écran de recherche d'adversaire (duel humain). L'état du ticket est un read model client
 * reconstruit par fold des notifications (historique REST + WebSocket) — aucun polling.
 */
export function MatchmakingPage() {
  const { ticketId = "" } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { ticket, isLoading, isError } = useTicket(ticketId);
  const cancel = useCancelMatchmaking(ticketId);

  const topicQuery = useTopicOverview(ticket.topicId ?? "");

  useEffect(() => {
    if (ticket.status === "MATCHED" && ticket.gameId) {
      navigate(`/duel/${ticket.gameId}`);
    }
  }, [ticket.status, ticket.gameId, navigate]);

  if (ticket.status === "CANCELLED") {
    return (
      <div className="grid h-full place-items-center bg-background p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="text-lg font-semibold">Recherche annulée</div>
          <Button fullWidth onPress={() => navigate("/topics")}>
            Retour aux sujets
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center bg-background p-6 text-sm text-muted">
        Recherche d'un adversaire…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="grid h-full place-items-center bg-background p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="text-lg font-semibold">
            Recherche momentanément indisponible
          </div>
          <Button fullWidth onPress={() => navigate("/topics")}>
            Retour aux sujets
          </Button>
        </div>
      </div>
    );
  }

  const topic = topicQuery.data?.topic;

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <SearchingScreen
        topic={{
          name: topic?.name ?? "Appariement en cours",
          emoji: topic?.emoji ?? undefined,
          color: topic?.color ?? undefined,
          imageUrl: topic?.imageUrl ?? undefined,
        }}
      />
      <div className="flex justify-center pb-6">
        <Button
          variant="outline"
          isDisabled={cancel.isPending}
          onPress={() => cancel.mutate()}
        >
          Annuler la recherche
        </Button>
      </div>
    </div>
  );
}
