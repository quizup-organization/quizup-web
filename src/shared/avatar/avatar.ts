import { Avatar, Style } from "@dicebear/core";
import type { StyleDefinition, StyleOptions } from "@dicebear/core";
import micahDefinition from "@dicebear/styles/micah.json";
import { hashString } from "@/lib/helpers";
import {
    BACKGROUND_COLORS,
    CLOTHES_VARIANTS,
    EARRING_COLORS,
    EARRINGS_VARIANTS,
    EARS_VARIANTS,
    EYEBROWS_VARIANTS,
    EYES_COLORS,
    EYES_VARIANTS,
    FACIAL_HAIR_VARIANTS,
    GLASSES_COLORS,
    GLASSES_VARIANTS,
    HAIR_COLORS,
    HAIR_VARIANTS,
    MOUTH_COLORS,
    MOUTH_VARIANTS,
    NOSE_VARIANTS,
    SHIRT_COLORS,
    SKIN_COLORS,
    type AvatarOptions,
    type AvatarShape,
} from "./micah-options";

const style = new Style(micahDefinition as StyleDefinition);

const cache = new Map<string, string>();
const CACHE_LIMIT = 600;

const SHAPE_RADIUS: Record<AvatarShape, number> = { circle: 50, rounded: 18, square: 0 };

function pick<T>(list: readonly T[], random: () => number): T {
    return list[Math.floor(random() * list.length)];
}

/** PRNG déterministe (mulberry32) pour dériver un avatar stable depuis un seed. */
function mulberry32(seed: number): () => number {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function variantOption(field: string, value: string | undefined): Record<string, unknown> {
    return value ? { [`${field}Variant`]: [value], [`${field}Probability`]: 100 } : {};
}

function optionalVariantOption(field: string, value: string | undefined): Record<string, unknown> {
    if (value === "none") return { [`${field}Probability`]: 0 };
    return variantOption(field, value);
}

function colorOption(name: string, value: string | undefined): Record<string, unknown> {
    return value ? { [name]: [value] } : {};
}

/** Convertit les options compactes persistées en options DiceBear valides. */
export function toDicebearOptions(options: AvatarOptions): StyleOptions {
    return {
        backgroundColor: options.backgroundColor ? [options.backgroundColor] : [],
        ...variantOption("hair", options.hair),
        ...colorOption("hairColor", options.hairColor),
        ...variantOption("eyebrows", options.eyebrows),
        ...colorOption("eyebrowsColor", options.eyebrowsColor),
        ...variantOption("eyes", options.eyes),
        ...colorOption("eyesColor", options.eyesColor),
        ...variantOption("nose", options.nose),
        ...variantOption("mouth", options.mouth),
        ...colorOption("mouthColor", options.mouthColor),
        ...optionalVariantOption("facialHair", options.facialHair),
        ...colorOption("facialHairColor", options.facialHairColor),
        ...optionalVariantOption("glasses", options.glasses),
        ...colorOption("glassesColor", options.glassesColor),
        ...optionalVariantOption("earrings", options.earrings),
        ...colorOption("earringColor", options.earringColor),
        ...variantOption("ears", options.ears),
        ...variantOption("clothes", options.clothes),
        ...colorOption("shirtColor", options.shirtColor),
        ...colorOption("baseColor", options.baseColor),
        ...(options.shape ? { borderRadius: SHAPE_RADIUS[options.shape] } : {}),
    } as StyleOptions;
}

function stableKey(options: AvatarOptions): string {
    return JSON.stringify(options, Object.keys(options).sort());
}

/**
 * Rend un avatar en data URI SVG. Sans options persistées, l'avatar est dérivé
 * de façon déterministe du `seed` (userId/nom).
 */
export function avatarDataUri(options: AvatarOptions | undefined, size: number, seed?: string): string {
    const key = `${seed ?? ""}:${size}:${options ? stableKey(options) : "seed"}`;
    const cached = cache.get(key);
    if (cached) return cached;
    const dicebearOptions = options ? toDicebearOptions(options) : {};
    const uri = new Avatar(style, { seed: seed ?? "quizup", size, ...dicebearOptions }).toDataUri();
    if (cache.size >= CACHE_LIMIT) {
        const oldest = cache.keys().next().value;
        if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, uri);
    return uri;
}

/** Parse une sérialisation d'options persistées, en tolérant l'absence/le contenu invalide. */
export function parseAvatarOptions(json: string | undefined | null): AvatarOptions | undefined {
    if (!json) return undefined;
    try {
        const parsed: unknown = JSON.parse(json);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
            return parsed as AvatarOptions;
        }
        return undefined;
    } catch {
        return undefined;
    }
}

function generateOptions(random: () => number): AvatarOptions {
    return {
        shape: "circle",
        hair: pick(HAIR_VARIANTS, random),
        hairColor: pick(HAIR_COLORS, random),
        eyebrows: pick(EYEBROWS_VARIANTS, random),
        eyebrowsColor: pick(HAIR_COLORS, random),
        eyes: pick(EYES_VARIANTS, random),
        eyesColor: pick(EYES_COLORS, random),
        nose: pick(NOSE_VARIANTS, random),
        mouth: pick(MOUTH_VARIANTS, random),
        mouthColor: pick(MOUTH_COLORS, random),
        facialHair: random() < 0.35 ? pick(FACIAL_HAIR_VARIANTS, random) : "none",
        facialHairColor: pick(HAIR_COLORS, random),
        glasses: random() < 0.3 ? pick(GLASSES_VARIANTS, random) : "none",
        glassesColor: pick(GLASSES_COLORS, random),
        earrings: random() < 0.3 ? pick(EARRINGS_VARIANTS, random) : "none",
        earringColor: pick(EARRING_COLORS, random),
        ears: pick(EARS_VARIANTS, random),
        clothes: pick(CLOTHES_VARIANTS, random),
        shirtColor: pick(SHIRT_COLORS, random),
        baseColor: pick(SKIN_COLORS, random),
        backgroundColor: pick(BACKGROUND_COLORS, random),
    };
}

/** Options déterministes dérivées d'un seed (userId / nom). */
export function defaultAvatarOptions(seed: string): AvatarOptions {
    return generateOptions(mulberry32(hashString(seed)));
}

/** Options aléatoires (bouton « Aléatoire »). */
export function randomAvatarOptions(): AvatarOptions {
    return generateOptions(Math.random);
}
