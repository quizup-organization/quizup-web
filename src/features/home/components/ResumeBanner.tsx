import { useNavigate } from "react-router-dom";
import { Play, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentGame } from "@/features/duel";

/**
 * Bandeau « Partie en cours — Rejoindre » en tête de l'Accueil, au même format que le bandeau
 * d'installation PWA (`InstallBanner`) : tuile d'icône, titre + sous-titre, action à droite.
 * Les défis et salons en attente vivent dans la section dédiée `PendingDuelsSection`.
 */
export function ResumeBanner() {
  const navigate = useNavigate();
  const currentGame = useCurrentGame();
  const game = currentGame.data ?? null;

  if (!game) return null;

  return (
    <div className="flex items-center gap-3 border-b bg-primary/[0.06] px-(--page-gutter-x) py-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Swords className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
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
    </div>
  );
}
