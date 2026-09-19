import type { CSSProperties } from "react";
import { cn } from "cn";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { veil } from "@/theme/tokens";

/**
 * Avatar joueur — enveloppe le `Avatar` shadcn natif (fallback initiales ou « face »),
 * avec les options de la maquette (couleur, glow, taille, anneau).
 */
interface UserAvatarProps {
    name: string;
    color?: string;
    size?: number;
    face?: boolean;
    glow?: string | null;
    ring?: boolean;
    className?: string;
}

export function UserAvatar({ name, color = "var(--primary)", size = 40, face = false, glow = null, ring = true, className }: UserAvatarProps) {
    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    const style: CSSProperties = {
        width: size,
        height: size,
        backgroundColor: face ? "#e8e8ea" : color,
        color: face ? "#2a2a2e" : "#08080a",
        border: ring ? `2px solid ${glow || (face ? "#ffffff" : color)}` : "none",
        boxShadow: glow ? `0 0 0 3px ${veil(glow, 22)}` : undefined,
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.36,
        letterSpacing: "-0.02em",
    };

    return (
        <Avatar className={cn("shrink-0", className)} style={style}>
            <AvatarFallback className="bg-transparent text-inherit">{face ? <span style={{ fontSize: size * 0.5, lineHeight: 1 }}>😐</span> : initials}</AvatarFallback>
        </Avatar>
    );
}
