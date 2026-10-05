import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentGame, useMyOpenLobbies } from "@/features/duel";

/**
 * Bannière de reprise sur l'Accueil : « Partie en cours — Rejoindre » (partie créée/en cours)
 * ou « Défi en attente — Ouvrir la salle » (salon ouvert). Masquée s'il n'y a rien à reprendre.
 */
export function ResumeBanner() {
  const navigate = useNavigate();
  const currentGame = useCurrentGame();
  const openLobbies = useMyOpenLobbies();

  const game = currentGame.data ?? null;
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
