import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSessionUserId } from "@/features/auth";
import {
  challengesService,
  useCurrentGame,
  useMyChallenges,
  useMyOpenLobbies,
} from "@/features/duel";
import { queryKeys } from "@/lib/query-keys";

/**
 * Bannière de reprise sur l'Accueil : « Partie en cours — Rejoindre », « Défi envoyé — Annuler »
 * (intention en attente) ou « Défi en attente — Ouvrir la salle » (salon ouvert). Masquée s'il
 * n'y a rien à reprendre.
 */
export function ResumeBanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const me = getSessionUserId();
  const currentGame = useCurrentGame();
  const challenges = useMyChallenges();
  const openLobbies = useMyOpenLobbies();
  const cancelChallenge = useMutation({
    mutationFn: (challengeId: string) => challengesService.cancel(challengeId),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.challenges.mine() }),
  });

  const game = currentGame.data ?? null;
  const sentChallenge =
    challenges.data?.find(
      (challenge) => challenge.challenger?.userId === me,
    ) ?? null;
  const lobby = openLobbies.data?.[0] ?? null;

  if (game) {
    return (
      <Card className="mb-6 gap-0 border-primary/30 bg-primary/[0.04] py-0">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Partie en cours</p>
            <p className="truncate text-xs text-muted-foreground">
              {game.topic.name}
              {game.opponent
                ? ` · contre ${game.opponent.pseudonym}`
                : " · contre le bot"}
            </p>
          </div>
          <Button size="sm" onClick={() => navigate(`/duel/${game.gameId}`)}>
            <Play /> Rejoindre
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (sentChallenge) {
    return (
      <Card className="mb-6 gap-0 border-primary/30 bg-primary/[0.04] py-0">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Défi envoyé</p>
            <p className="truncate text-xs text-muted-foreground">
              En attente de{" "}
              {sentChallenge.opponent?.pseudonym ?? "ton adversaire"}…
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={cancelChallenge.isPending}
            onClick={() => cancelChallenge.mutate(sentChallenge.challengeId)}
          >
            Annuler
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!lobby) return null;

  return (
    <Card className="mb-6 gap-0 border-primary/30 bg-primary/[0.04] py-0">
      <CardContent className="flex items-center justify-between gap-4 py-4">
        <div className="min-w-0">
          <p className="text-sm font-medium">Défi en attente</p>
          <p className="truncate text-xs text-muted-foreground">
            {lobby.topic.name}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(`/lobbies/${lobby.lobbyId}`)}
        >
          Ouvrir la salle
        </Button>
      </CardContent>
    </Card>
  );
}
