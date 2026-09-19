import { cn } from "cn";

/**
 * Donut de répartition par thème (profil joueur) — SVG pur, sans dépendance.
 * Chaque part est un `<circle>` avec `stroke-dasharray` ; légende à côté.
 * Couleurs = couleurs éditoriales des sujets (donnée API).
 */
export interface DonutSlice {
    label: string;
    value: number;
    color: string;
}

interface TopicDonutProps {
    slices: DonutSlice[];
    size?: number;
    className?: string;
}

const R = 42;
const C = 2 * Math.PI * R;

export function TopicDonut({ slices, size = 180, className }: TopicDonutProps) {
    const total = slices.reduce((s, x) => s + x.value, 0) || 1;
    let offset = 0;

    return (
        <div className={cn("flex flex-col items-center gap-5 sm:flex-row sm:gap-8", className)}>
            <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label="Répartition des duels par thème" className="shrink-0">
                <circle cx="50" cy="50" r={R} fill="none" stroke="var(--muted)" strokeWidth="16" />
                {slices.map((s) => {
                    const len = (s.value / total) * C;
                    const el = (
                        <circle
                            key={s.label}
                            cx="50"
                            cy="50"
                            r={R}
                            fill="none"
                            stroke={s.color}
                            strokeWidth="16"
                            strokeDasharray={`${len} ${C - len}`}
                            strokeDashoffset={-offset}
                            transform="rotate(-90 50 50)"
                        />
                    );
                    offset += len;
                    return el;
                })}
            </svg>
            <ul className="flex w-full flex-col gap-2">
                {slices.map((s) => (
                    <li key={s.label} className="flex items-center gap-2.5 text-sm">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="min-w-0 flex-1 truncate">{s.label}</span>
                        <span className="font-heading font-bold tabular-nums">{s.value}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
