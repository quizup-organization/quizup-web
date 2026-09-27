import type { CSSProperties } from "react";
import { cn } from "cn";

/**
 * Pastille de sujet (image de couverture, ou emoji de repli sur fond coloré).
 * `topic.color` est de la donnée éditoriale (API), pas du thème.
 */
interface TopicIconProps {
    topic: { emoji: string | null; color: string | null; imageUrl?: string | null };
    size?: number;
    className?: string;
}

export function TopicIcon({ topic, size = 44, className }: TopicIconProps) {
    return (
        <span
            className={cn("grid shrink-0 place-items-center overflow-hidden rounded-2xl select-none", className)}
            style={{ width: size, height: size, backgroundColor: topic.color ?? "var(--muted)", fontSize: size * 0.5, lineHeight: 1 } as CSSProperties}
        >
            {topic.imageUrl ? (
                <img
                    src={topic.imageUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                />
            ) : (
                topic.emoji
            )}
        </span>
    );
}
