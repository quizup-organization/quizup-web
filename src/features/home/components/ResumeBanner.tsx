import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Play, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrentGame } from "@/features/duel";

/**
 * Bandeau global « Partie en cours — Rejoindre » (monté dans la coquille, tous écrans hors
 * immersion). Une seule partie (la dernière lancée) ; le bandeau s'estompe dès qu'elle est
 * terminée. Même format que le bandeau d'installation PWA.
 */
export function ResumeBanner() {
  const navigate = useNavigate();
  const game = useCurrentGame().data ?? null;

  return (
    <AnimatePresence initial={false}>
      {game && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center gap-3 border-b bg-primary/[0.06] px-(--page-gutter-x) py-2.5"
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
