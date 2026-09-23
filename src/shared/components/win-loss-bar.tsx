import { cn } from "cn";

/**
 * Barre de résultats V / N / D (statistiques d'un joueur), façon QuizUp.
 * Segments proportionnels + pourcentages sous la barre. Purement présentationnel.
 */
interface WinLossBarProps {
    wins: number;
    draws: number;
    losses: number;
    className?: string;
}

export function WinLossBar({ wins, draws, losses, className }: WinLossBarProps) {
    const total = Math.max(1, wins + draws + losses);
    const pct = (n: number) => Math.round((n / total) * 100);

    /* Chaque label / pourcentage est centré sur son segment (mêmes proportions que la barre). */
    const columns = `${wins}fr ${draws}fr ${losses}fr`;

    return (
        <div className={cn("flex flex-col gap-2", className)}>
            <div className="grid text-[11px] font-semibold text-muted-foreground" style={{ gridTemplateColumns: columns }}>
                <span className="whitespace-nowrap px-1 text-center">Victoires</span>
                <span className="whitespace-nowrap px-1 text-center">Nuls</span>
                <span className="whitespace-nowrap px-1 text-center">Défaites</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                <span className="bg-emerald-500" style={{ width: `${pct(wins)}%` }} />
                <span className="bg-amber-400" style={{ width: `${pct(draws)}%` }} />
                <span className="bg-destructive" style={{ width: `${pct(losses)}%` }} />
            </div>
            <div className="grid text-xs font-semibold tabular-nums" style={{ gridTemplateColumns: columns }}>
                <span className="text-center text-emerald-500">{pct(wins)}%</span>
                <span className="text-center text-amber-500">{pct(draws)}%</span>
                <span className="text-center text-destructive">{pct(losses)}%</span>
            </div>
        </div>
    );
}
