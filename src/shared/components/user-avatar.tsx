import type { CSSProperties } from "react";
import { useMemo } from "react";
import { cn } from "cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { avatarDataUri, parseAvatarOptions } from "@/shared/avatar/avatar";
import { shapeClassName } from "@/shared/avatar/micah-options";

/**
 * Avatar joueur — rend l'avatar DiceBear (style micah) dérivé des options
 * persistées du profil, ou déterministiquement du `userId`/nom à défaut.
 *
 * Toutes les caractéristiques visuelles (forme, fond, couleurs) proviennent
 * **de l'avatar lui-même** : rien n'est forcé par l'appelant. La présence
 * éventuelle est indiquée par `PresenceBadge`, jamais par une bordure.
 */
interface UserAvatarProps {
    name: string;
    userId?: string;
    avatarOptions?: string;
    size?: number;
    className?: string;
}

/** Identité d'avatar (userId/options) pour transmettre l'avatar d'un joueur. */
export interface AvatarIdentity {
    userId?: string;
    avatarOptions?: string;
}

export function UserAvatar({ name, userId, avatarOptions, size = 40, className }: UserAvatarProps) {
    const options = useMemo(() => parseAvatarOptions(avatarOptions), [avatarOptions]);
    const seed = userId ?? name;
    const src = useMemo(() => avatarDataUri(options, size * 2, seed), [options, size, seed]);
    const shape = shapeClassName(options?.shape);

    const initials = name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    const style: CSSProperties = {
        width: size,
        height: size,
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.36,
        letterSpacing: "-0.02em",
    };

    return (
        <Avatar
            className={cn("shrink-0 overflow-hidden bg-transparent after:hidden", shape, className)}
            style={style}
        >
            <AvatarImage src={src} alt="" className={shape} />
            <AvatarFallback className="bg-muted text-inherit">{initials}</AvatarFallback>
        </Avatar>
    );
}
