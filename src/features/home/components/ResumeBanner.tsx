import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCurrentGame } from "@/features/duel";

/**
 * Bannière de reprise sur l'Accueil : « Partie en cours — Rejoindre ». Les défis et salons en
 * attente vivent dans la section dédiée `PendingDuelsSection`. Masquée sans partie en cours.
 */
export function ResumeBanner() {
  const navigate = useNavigate();
  const currentGame = useCurrentGame();
  const game = currentGame.data ?? null;

  if (!game) return null;

  return (
    <Card className="mb-6 gap-0 border-primary/30 bg-[color-mix(in_srgb,var(--primary)_6%,var(--card))] py-0">
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
