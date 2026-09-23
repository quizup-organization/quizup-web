import type { CSSProperties } from "react";
import { cn } from "cn";

/**
 * Pastille de sujet (emoji sur fond coloré).
 * `topic.color` est de la donnée éditoriale (API), pas du thème.
 */
interface TopicIconProps {
    topic: { emoji: string; color: string };
    size?: number;
    className?: string;
}

export function TopicIcon({ topic, size = 44, className }: TopicIconProps) {
    return (
        <span
            className={cn("grid shrink-0 place-items-center rounded-2xl select-none", className)}
            style={{ width: size, height: size, backgroundColor: topic.color, fontSize: size * 0.5, lineHeight: 1 } as CSSProperties}
        >
            {topic.emoji}
        </span>
    );
}
