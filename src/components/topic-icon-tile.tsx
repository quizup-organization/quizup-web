import { TopicIcon } from "@/components/topic-icon";
import type { Topic, TopicStats } from "@/shared/types/domain";
import { cn } from "cn";

/**
 * Tuile de sujet compacte — icône + nom + légende.
 * Utilisée par la grille « Mes thèmes » (légende = niveau) et les carrousels du catalogue
 * (légende = catégorie).
 */
interface TopicIconTileProps {
    topic: Topic;
    onOpen: (topicId: string) => void;
    stats?: TopicStats;
    /** Légende sous le nom. Défaut : « Niveau N » si `stats` fourni, sinon rien. */
    caption?: string;
    size?: number;
    className?: string;
}

export function TopicIconTile({ topic, onOpen, stats, caption, size = 56, className }: TopicIconTileProps) {
    const legend = caption ?? (stats ? `Niveau ${stats.level}` : undefined);
    return (
        <button
            type="button"
            onClick={() => onOpen(topic.id)}
            className={cn("qu-hoverable flex w-[92px] shrink-0 flex-col items-center gap-2 text-center", className)}
        >
            <TopicIcon topic={topic} size={size} />
            <span className="min-w-0 w-full">
                <span className="line-clamp-2 text-xs font-semibold leading-tight">{topic.name}</span>
                {legend && <span className="mt-0.5 block text-[11px] text-muted-foreground">{legend}</span>}
            </span>
        </button>
    );
}
