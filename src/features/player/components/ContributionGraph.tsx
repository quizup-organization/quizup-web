import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ActivityDay } from "@/features/player/domain/activity";
import {
  YEAR_WEEKS,
  addDays,
  toIso,
  windowBounds,
  type ContributionRange,
} from "@/shared/utils/activity";

interface ContributionGraphProps {
  days: ActivityDay[];
  /** Nombre de semaines affichées en vue annuelle (défaut 53, soit ~1 an). */
  weeks?: number;
  /** Fenêtre affichée : `month` = 15 jours avant/après aujourd'hui, `year` = 53 dernières semaines. */
  range?: ContributionRange;
  className?: string;
}

interface Cell {
  iso: string;
  date: Date;
  games: number;
  /** Jour appartenant à la fenêtre affichée (les jours de calage sont masqués). */
  inWindow: boolean;
  isToday: boolean;
  isFuture: boolean;
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

/** Semaine commençant le lundi. */
const WEEKDAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];

function levelOf(games: number): number {
  if (games <= 0) return 0;
  if (games === 1) return 1;
  if (games === 2) return 2;
  if (games <= 4) return 3;
  return 4;
}

function formatDay(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function cellLabel(cell: Cell): string {
  const day = formatDay(cell.date);
  if (cell.isFuture) return `${day} (à venir)`;
  if (cell.games > 0) {
    return `${cell.games} partie${cell.games > 1 ? "s" : ""} le ${day}`;
  }
  return `Aucune partie le ${day}`;
}

function buildCell(
  byDate: Map<string, number>,
  cursor: Date,
  windowStart: Date,
  windowEnd: Date,
  today: Date,
): Cell {
  const iso = toIso(cursor);
  const inWindow = cursor >= windowStart && cursor <= windowEnd;
  return {
    iso,
    date: new Date(cursor),
    games: inWindow ? (byDate.get(iso) ?? 0) : 0,
    inWindow,
    isToday: cursor.getTime() === today.getTime(),
    isFuture: cursor > today,
  };
}

/**
 * Graphe d'activité.
 * - `month` : calendrier hebdomadaire — les 7 jours de la semaine en colonnes (lun → dim),
 *   chaque semaine sur une ligne, fenêtre de 15 jours autour d'aujourd'hui.
 * - `year` : graphe de contributions façon GitHub sur 53 semaines (colonnes = semaines).
 * Aucun jour futur n'est coloré.
 */
export function ContributionGraph({
  days,
  weeks = YEAR_WEEKS,
  range = "year",
  className,
}: ContributionGraphProps) {
  const model = useMemo(() => {
    const byDate = new Map(days.map((day) => [day.date, day.games]));
    const { today, start: windowStart, end: windowEnd } = windowBounds(
      range,
      weeks,
    );

    if (range === "month") {
      const mondayOffset = (windowStart.getDay() + 6) % 7;
      const calendarStart = addDays(windowStart, -mondayOffset);
      const sundayOffset = (7 - windowEnd.getDay()) % 7;
      const calendarEnd = addDays(windowEnd, sundayOffset);

      const cells: Cell[] = [];
      for (
        let cursor = calendarStart;
        cursor <= calendarEnd;
        cursor = addDays(cursor, 1)
      ) {
        cells.push(
          buildCell(byDate, cursor, windowStart, windowEnd, today),
        );
      }
      return { kind: "month" as const, cells };
    }

    const start = addDays(windowStart, -windowStart.getDay());
    const end = addDays(windowEnd, 6 - windowEnd.getDay());

    const allCells: Cell[] = [];
    for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
      allCells.push(buildCell(byDate, cursor, windowStart, windowEnd, today));
    }

    const columns: Week[] = [];
    for (let i = 0; i < allCells.length; i += 7) {
      const cells = allCells.slice(i, i + 7);
      columns.push({ cells, month: cells[0].date.getMonth() });
    }

    const monthLabels = columns.map((week, index) =>
      index === 0 || week.month !== columns[index - 1].month
        ? MONTHS[week.month]
        : "",
    );

    return { kind: "year" as const, columns, monthLabels };
  }, [days, weeks, range]);

  if (model.kind === "month") {
    return (
      <div
        className={cn("mx-auto grid w-full gap-1.5", className)}
        style={{
          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
          maxWidth: 460,
        }}
      >
        {WEEKDAYS.map((day) => (
          <span
            key={day}
            className="pb-1 text-center text-xs text-muted-foreground"
          >
            {day}
          </span>
        ))}
        {model.cells.map((cell) => {
          if (!cell.inWindow) {
            return <span key={cell.iso} aria-hidden className="aspect-square" />;
          }
          const level = levelOf(cell.games);
          return (
            <span
              key={cell.iso}
              title={cellLabel(cell)}
              aria-label={cellLabel(cell)}
              className={cn(
                "aspect-square rounded-md",
                level === 0 && "bg-muted",
                cell.isToday && "ring-1 ring-foreground/40",
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
    );
  }

  return (
    <div className={cn("flex gap-2 text-muted-foreground", className)}>
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
            {model.monthLabels.map((label, index) => (
              <span key={index} className="w-[11px] whitespace-nowrap">
                {label}
              </span>
            ))}
          </div>
          <div className="flex gap-[3px]">
            {model.columns.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.cells.map((cell) => {
                  if (!cell.inWindow) {
                    return (
                      <span
                        key={cell.iso}
                        aria-hidden
                        className="size-[11px] rounded-[2px] opacity-0"
                      />
                    );
                  }

                  const level = levelOf(cell.games);
                  return (
                    <span
                      key={cell.iso}
                      title={cellLabel(cell)}
                      aria-label={cellLabel(cell)}
                      className={cn(
                        "size-[11px] rounded-[2px]",
                        level === 0 && "bg-muted",
                        cell.isToday && "ring-1 ring-foreground/40",
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
