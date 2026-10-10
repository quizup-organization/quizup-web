import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveGames } from "@/features/game";
import { useTopicName } from "@/features/shell";

/**
 * Bandeau global « Partie en cours — Rejoindre » (monté dans la coquille, tous écrans hors
 * immersion). Affiche la partie active la plus récente (`GET /api/games?active=true`) ; le
 * bandeau s'estompe dès qu'elle est terminée. Rouge « alerte » + animations discrètes (halo,
 * point live) pour capter l'attention sans gêner la lecture ; animations coupées en
 * `prefers-reduced-motion`.
 */
export function ResumeBanner() {
  const navigate = useNavigate();
  const resolveName = useTopicName();
  const game = useActiveGames().data?.[0] ?? null;

  return (
    <AnimatePresence initial={false}>
      {game && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="relative flex items-center gap-3 overflow-hidden bg-destructive/[0.07] px-(--page-gutter-x) py-2.5"
        >
          <span className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive">
            {/* Halo rouge animé derrière l'icône. */}
            <span
              aria-hidden
              className="absolute -inset-1 animate-pulse rounded-xl bg-destructive/30 blur-[3px] motion-reduce:animate-none"
            />
            <Swords className="relative size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
              {/* Point « live » : double anneau qui pulse. */}
              <span aria-hidden className="relative flex size-2 shrink-0">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-destructive" />
              </span>
              Partie en cours
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {resolveName(game.topic.names)}
              {game.opponent
                ? ` · contre ${game.opponent.pseudonym}`
                : " · contre le bot"}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => navigate(`/game/${game.gameId}`)}
          >
            <Play /> Rejoindre
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
