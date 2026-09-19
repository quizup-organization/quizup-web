import { Flame, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ContributionGraph } from "@/shared/components/ContributionGraph";
import type { Activity } from "@/shared/types/domain";

interface ActivityPanelProps {
  activity: Activity | undefined;
  isLoading?: boolean;
}

/**
 * Panneau d'activité journalière : série courante/record + graphe de contribution.
 */
export function ActivityPanel({ activity, isLoading }: ActivityPanelProps) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 font-heading text-base font-semibold">Activité</h2>
      <Card size="sm">
        <CardContent className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <Flame className="size-4 text-[var(--duel-score)]" />
              <span className="text-muted-foreground">Série actuelle</span>
              <strong>{activity?.currentStreak ?? 0} j</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <Trophy className="size-4 text-[var(--duel-correct-accent)]" />
              <span className="text-muted-foreground">Record</span>
              <strong>{activity?.longestStreak ?? 0} j</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-muted-foreground">Jours actifs (1 an)</span>
              <strong>{activity?.totalActiveDays ?? 0}</strong>
            </span>
          </div>

          {isLoading && !activity ? (
            <p className="text-sm text-muted-foreground">Chargement de l'activité…</p>
          ) : (
            <ContributionGraph days={activity?.days ?? []} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
