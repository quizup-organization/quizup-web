import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { topicsService, toTopicView } from "@/lib/services/topics";
import { TOKEN } from "@/theme/tokens";
import { SearchingScreen } from "../components/SearchingScreen";
import { useCancelMatchmaking } from "../hooks/useMatchmaking";
import { useLobby } from "../hooks/useLobby";

/**
 * Écran de recherche d'adversaire (duel humain). L'état du lobby est un read model client
 * reconstruit par fold des notifications (historique REST + WebSocket) — aucun polling.
 */
export function MatchmakingPage() {
  const { ticketId = "" } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { lobby, isLoading, isError } = useLobby(ticketId);
  const cancel = useCancelMatchmaking(ticketId);

  const topicQuery = useQuery({
    queryKey: queryKeys.topics.detail(lobby.topicId ?? ""),
    queryFn: () => topicsService.getById(lobby.topicId as string),
    enabled: !!lobby.topicId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (lobby.status === "COMPLETED" && lobby.gameId) {
      navigate(`/duel/${lobby.gameId}`);
    }
  }, [lobby.status, lobby.gameId, navigate]);

  if (lobby.status === "CANCELLED" || lobby.status === "EXPIRED") {
    return (
      <div className="grid h-full place-items-center bg-background p-6">
        <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
          <div className="text-lg font-semibold">Recherche annulée</div>
          <Button className="w-full" onClick={() => navigate("/topics")}>
            Retour aux sujets
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center bg-background p-6 text-sm text-muted-foreground">
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
          <Button className="w-full" onClick={() => navigate("/topics")}>
            Retour aux sujets
          </Button>
        </div>
      </div>
    );
  }

  const topic = topicQuery.data ? toTopicView(topicQuery.data) : null;

  return (
    <div
      className="relative flex h-full flex-col overflow-hidden"
      style={{ background: TOKEN.duelBg }}
    >
      <SearchingScreen
        topic={{
          name: topic?.name ?? "Appariement en cours",
          emoji: topic?.emoji,
          color: topic?.color,
        }}
      />
      <div className="flex justify-center pb-6">
        <Button
          variant="outline"
          disabled={cancel.isPending}
          onClick={() => cancel.mutate()}
        >
          Annuler la recherche
        </Button>
      </div>
    </div>
  );
}
