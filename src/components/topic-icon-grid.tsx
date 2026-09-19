import type { Topic } from "@/shared/types/domain";
import { cn } from "cn";

/**
 * Grille dense d'icônes de sujets (hero de découverte, façon « parcourir tous les sujets »).
 * Chaque case est un bouton qui ouvre la fiche du sujet ; le libellé passe par `aria-label`.
 */
interface TopicIconGridProps {
    topics: Topic[];
    onOpen: (topicId: string) => void;
    className?: string;
}

export function TopicIconGrid({ topics, onOpen, className }: TopicIconGridProps) {
    return (
        <div className={cn("grid grid-cols-4 gap-1 sm:grid-cols-6 lg:grid-cols-8", className)}>
            {topics.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    aria-label={t.name}
                    title={t.name}
                    onClick={() => onOpen(t.id)}
                    className="qu-hoverable grid aspect-square place-items-center rounded-lg text-2xl"
                    style={{ backgroundColor: t.color }}
                >
                    <span aria-hidden>{t.emoji}</span>
                </button>
            ))}
        </div>
    );
}
