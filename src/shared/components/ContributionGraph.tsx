import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ActivityDay } from "@/shared/types/domain";

interface ContributionGraphProps {
  days: ActivityDay[];
  /** Nombre de semaines affichées (défaut 53, soit ~1 an). */
  weeks?: number;
  className?: string;
}

interface Cell {
  date: Date;
  iso: string;
  games: number;
}

interface Week {
  cells: Cell[];
  month: number;
}

const MONTHS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

function toIso(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function levelOf(games: number): number {
  if (games <= 0) return 0;
  if (games === 1) return 1;
  if (games === 2) return 2;
  if (games <= 4) return 3;
  return 4;
}

/**
 * Graphe de contributions façon GitHub : une colonne par semaine, une case par jour, l'intensité
 * reflétant le nombre de parties jouées. Aucun mois/jour futur n'est coloré.
 */
export function ContributionGraph({
  days,
  weeks = 53,
  className,
}: ContributionGraphProps) {
  const { columns, monthLabels } = useMemo(() => {
    const byDate = new Map(days.map((day) => [day.date, day.games]));

    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const windowStart = addDays(end, -(weeks * 7 - 1));
    const start = addDays(windowStart, -windowStart.getDay());

    const allCells: Cell[] = [];
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      const iso = toIso(cursor);
      allCells.push({ date: new Date(cursor), iso, games: byDate.get(iso) ?? 0 });
    }

    const grouped: Week[] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      const cells = allCells.slice(i, i + 7);
      grouped.push({ cells, month: cells[0].date.getMonth() });
    }

    const labels = grouped.map((week, index) =>
      index === 0 || week.month !== grouped[index - 1].month
        ? MONTHS[week.month]
        : "",
    );

    return { columns: grouped, monthLabels: labels };
  }, [days, weeks]);

  return (
    <div className={cn("flex gap-2 text-xs text-muted-foreground", className)}>
      <div className="flex flex-col gap-[3px] pt-4 text-[10px] leading-[11px]">
        <span className="h-[11px]" />
        <span className="h-[11px]">lun</span>
        <span className="h-[11px]" />
        <span className="h-[11px]">mer</span>
        <span className="h-[11px]" />
        <span className="h-[11px]">ven</span>
        <span className="h-[11px]" />
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="flex gap-[3px] pb-1 text-[10px] leading-[11px]">
            {monthLabels.map((label, index) => (
              <span key={index} className="w-[11px] whitespace-nowrap">
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {columns.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.cells.map((cell) => {
                  const level = levelOf(cell.games);
                  const label =
                    cell.games > 0
                      ? `${cell.games} partie${cell.games > 1 ? "s" : ""} le ${cell.date.toLocaleDateString("fr-FR")}`
                      : `Aucune partie le ${cell.date.toLocaleDateString("fr-FR")}`;
                  return (
                    <span
                      key={cell.iso}
                      title={label}
                      aria-label={label}
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
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
