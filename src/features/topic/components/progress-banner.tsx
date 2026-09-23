import { cn } from "cn";
import { Progress } from "@/components/ui/progress";

/**
 * Barre « questions complétées » des fiches thème — libellé capitalisé + pourcentage + barre.
 * Alimentée par la progression du joueur sur le sujet (`TopicStats.pct`).
 */
interface ProgressBannerProps {
    label: string;
    value: number;
    className?: string;
}

export function ProgressBanner({ label, value, className }: ProgressBannerProps) {
    const pct = Math.max(0, Math.min(100, value));
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            <div className="flex items-baseline justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold tabular-nums text-muted-foreground">{Math.round(pct)} %</span>
            </div>
            <Progress value={pct} className="[&>[data-slot=progress-track]]:h-2" />
        </div>
    );
}
