import type { ComponentType, CSSProperties } from "react";

/** Type d'icône lucide accepté comme prop par les composants. */
export type IconType = ComponentType<{
    size?: number | string;
    color?: string;
    style?: CSSProperties;
    className?: string;
    fill?: string;
    strokeWidth?: number;
}>;
