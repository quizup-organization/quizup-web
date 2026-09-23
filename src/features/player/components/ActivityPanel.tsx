import { useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ContributionGraph } from "./ContributionGraph";
import {
  countActiveDays,
  windowBounds,
  type ContributionRange,
} from "@/shared/utils/activity";
import type { Activity } from "@/features/player/domain/activity";

interface ActivityPanelProps {
  activity: Activity | undefined;
  isLoading?: boolean;
}

function formatDays(days: number): string {
  return `${days} jour${days > 1 ? "s" : ""}`;
}

function formatRange(range: ContributionRange): string {
  const { start, end } = windowBounds(range);
  const format = (date: Date) =>
    date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${format(start)} – ${format(end)}`;
}

/**
 * Panneau d'activité : séries + graphe de contribution, commutable entre une vue
 * « Mois » (15 jours autour d'aujourd'hui) et une vue « Année » (12 derniers mois).
 */
export function ActivityPanel({ activity, isLoading }: ActivityPanelProps) {
  const [range, setRange] = useState<ContributionRange>("month");
  const days = activity?.days ?? [];
  const activeDays = countActiveDays(days, range);

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-base font-semibold">Ton activité</h2>
        <ToggleGroup
          variant="outline"
          size="sm"
          aria-label="Période affichée"
          value={[range]}
          onValueChange={(value) => {
            const next = value[0];
            if (next === "month" || next === "year") setRange(next);
          }}
        >
          <ToggleGroupItem value="month">Mois</ToggleGroupItem>
          <ToggleGroupItem value="year">Année</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <Card size="sm">
        <CardContent className="flex flex-col gap-4 px-4 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-2">
              <Flame className="size-4 text-[var(--duel-score)]" />
              <span className="text-muted-foreground">Série en cours</span>
              <strong>{formatDays(activity?.currentStreak ?? 0)}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <Trophy className="size-4 text-[var(--duel-correct-accent)]" />
              <span className="text-muted-foreground">Meilleure série</span>
              <strong>{formatDays(activity?.longestStreak ?? 0)}</strong>
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="text-muted-foreground">Jours joués</span>
              <strong>{activeDays}</strong>
            </span>
          </div>

          {isLoading && !activity ? (
            <p className="text-sm text-muted-foreground">
              Chargement de l'activité…
            </p>
          ) : (
            <ContributionGraph days={days} range={range} />
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>{formatRange(range)}</span>
            <span className="inline-flex items-center gap-1.5">
              <span>Moins</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <span
                  key={level}
                  className={cn(
                    "size-[11px] rounded-[2px]",
                    level === 0 && "bg-muted",
                  )}
                  style={
                    level > 0
                      ? {
                          backgroundColor: "var(--duel-correct-accent)",
                          opacity: 0.25 * level,
                        }
                      : undefined
                  }
                />
              ))}
              <span>Plus</span>
            </span>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
