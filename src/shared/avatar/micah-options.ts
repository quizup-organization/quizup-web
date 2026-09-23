import {
    Brush,
    Ear,
    Eye,
    Gem,
    Glasses,
    PaintBucket,
    Palette,
    Scissors,
    Shirt,
    Smile,
    Triangle,
    VenetianMask,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/* ---------- Modèle d'options d'avatar (style DiceBear « micah ») ---------- */

export const HAIR_VARIANTS = [
    "dannyPhantom",
    "dougFunny",
    "fonze",
    "full",
    "mrClean",
    "mrT",
    "pixie",
    "turban",
] as const;

export const EYEBROWS_VARIANTS = ["down", "eyelashesDown", "eyelashesUp", "up"] as const;

export const EYES_VARIANTS = ["eyes", "eyesShadow", "round", "smiling", "smilingShadow"] as const;

export const NOSE_VARIANTS = ["curve", "pointed", "tound"] as const;

export const MOUTH_VARIANTS = [
    "frown",
    "laughing",
    "nervous",
    "pucker",
    "sad",
    "smile",
    "smirk",
    "surprised",
] as const;

export const FACIAL_HAIR_VARIANTS = ["beard", "scruff"] as const;

export const GLASSES_VARIANTS = ["round", "square"] as const;

export const EARRINGS_VARIANTS = ["hoop", "stud"] as const;

export const EARS_VARIANTS = ["attached", "detached"] as const;

export const CLOTHES_VARIANTS = ["collared", "crew", "open"] as const;

export type AvatarShape = "circle" | "rounded" | "square";

/** Options d'avatar persistées (une valeur par attribut + couleurs). */
export interface AvatarOptions {
    shape?: AvatarShape;
    hair?: (typeof HAIR_VARIANTS)[number];
    hairColor?: string;
    eyebrows?: (typeof EYEBROWS_VARIANTS)[number];
    eyebrowsColor?: string;
    eyes?: (typeof EYES_VARIANTS)[number];
    eyesColor?: string;
    nose?: (typeof NOSE_VARIANTS)[number];
    mouth?: (typeof MOUTH_VARIANTS)[number];
    mouthColor?: string;
    facialHair?: (typeof FACIAL_HAIR_VARIANTS)[number] | "none";
    facialHairColor?: string;
    glasses?: (typeof GLASSES_VARIANTS)[number] | "none";
    glassesColor?: string;
    earrings?: (typeof EARRINGS_VARIANTS)[number] | "none";
    earringColor?: string;
    ears?: (typeof EARS_VARIANTS)[number];
    clothes?: (typeof CLOTHES_VARIANTS)[number];
    shirtColor?: string;
    baseColor?: string;
    backgroundColor?: string;
}

export type VariantField =
    | "hair"
    | "eyebrows"
    | "eyes"
    | "nose"
    | "mouth"
    | "facialHair"
    | "glasses"
    | "earrings"
    | "ears"
    | "clothes";

export type ColorField =
    | "hairColor"
    | "eyebrowsColor"
    | "eyesColor"
    | "mouthColor"
    | "facialHairColor"
    | "glassesColor"
    | "earringColor"
    | "shirtColor"
    | "baseColor"
    | "backgroundColor";

/* ---------- Palettes ---------- */

export const HAIR_COLORS = [
    "#18181b",
    "#3f3f46",
    "#78350f",
    "#b45309",
    "#dc2626",
    "#db2777",
    "#7c3aed",
    "#2563eb",
    "#0891b2",
    "#16a34a",
    "#facc15",
    "#f472b6",
    "#e5e7eb",
];

export const BROW_COLORS = HAIR_COLORS;

export const EYES_COLORS = ["#000000", "#3f3f46", "#1d4ed8", "#166534", "#7c2d12"];

export const MOUTH_COLORS = ["#000000", "#7f1d1d", "#b45309", "#be185d"];

export const GLASSES_COLORS = ["#000000", "#3f3f46", "#78350f", "#1d4ed8", "#be185d", "#e5e7eb"];

export const EARRING_COLORS = ["#facc15", "#e5e7eb", "#f97316", "#be185d", "#38bdf8", "#000000"];

export const SHIRT_COLORS = [
    "#8b5cf6",
    "#06b6d4",
    "#f97316",
    "#22c55e",
    "#ec4899",
    "#14b8a6",
    "#eab308",
    "#ef4444",
    "#3b82f6",
    "#a1a1aa",
    "#18181b",
    "#fafafa",
];

export const SKIN_COLORS = [
    "#f9c9b6",
    "#f3c1a3",
    "#e8b18c",
    "#d99a6c",
    "#ac6651",
    "#8d5524",
    "#6b3f1d",
];

/** `""` = fond transparent (le Style micah n'accepte pas « transparent »). */
export const BACKGROUND_COLORS = [
    "",
    "#e4e4e7",
    "#dbeafe",
    "#dcfce7",
    "#fef9c3",
    "#fae8ff",
    "#ffe4e6",
    "#e0f2fe",
    "#f3f4f6",
    "#ffffff",
];

/* ---------- Sections & groupes de l'éditeur ---------- */

export const NONE_LABEL = "Aucun";

export interface AvatarEditorSection {
    id: VariantField | "skin" | "background";
    label: string;
    icon: LucideIcon;
    variantField?: VariantField;
    variants?: readonly string[];
    /** Libellés FR par variante (sinon la clé brute). */
    labels?: Record<string, string>;
    allowsNone?: boolean;
    colorField?: ColorField;
    colors?: readonly string[];
    colorLabel?: string;
}

export interface AvatarEditorGroup {
    id: string;
    label: string;
    icon: LucideIcon;
    sections: AvatarEditorSection[];
}

export const AVATAR_EDITOR_GROUPS: AvatarEditorGroup[] = [
    {
        id: "visage",
        label: "Visage",
        icon: Smile,
        sections: [
            {
                id: "eyes",
                label: "Yeux",
                icon: Eye,
                variantField: "eyes",
                variants: EYES_VARIANTS,
                labels: {
                    eyes: "Simples",
                    eyesShadow: "Ombrés",
                    round: "Ronds",
                    smiling: "Souriants",
                    smilingShadow: "Souriants ombrés",
                },
                colorField: "eyesColor",
                colors: EYES_COLORS,
                colorLabel: "Couleur des yeux",
            },
            {
                id: "eyebrows",
                label: "Sourcils",
                icon: Brush,
                variantField: "eyebrows",
                variants: EYEBROWS_VARIANTS,
                labels: {
                    down: "Tombants",
                    eyelashesDown: "Cils bas",
                    eyelashesUp: "Cils hauts",
                    up: "Relevés",
                },
                colorField: "eyebrowsColor",
                colors: BROW_COLORS,
                colorLabel: "Couleur des sourcils",
            },
            {
                id: "nose",
                label: "Nez",
                icon: Triangle,
                variantField: "nose",
                variants: NOSE_VARIANTS,
                labels: { curve: "Courbé", pointed: "Pointu", tound: "Arrondi" },
            },
            {
                id: "mouth",
                label: "Bouche",
                icon: Smile,
                variantField: "mouth",
                variants: MOUTH_VARIANTS,
                labels: {
                    frown: "Froncée",
                    laughing: "Rire",
                    nervous: "Nerveuse",
                    pucker: "Moue",
                    sad: "Triste",
                    smile: "Sourire",
                    smirk: "Sournois",
                    surprised: "Surprise",
                },
                colorField: "mouthColor",
                colors: MOUTH_COLORS,
                colorLabel: "Couleur de la bouche",
            },
        ],
    },
    {
        id: "cheveux",
        label: "Cheveux",
        icon: Scissors,
        sections: [
            {
                id: "hair",
                label: "Coiffure",
                icon: Scissors,
                variantField: "hair",
                variants: HAIR_VARIANTS,
                labels: {
                    dannyPhantom: "Danny",
                    dougFunny: "Doug",
                    fonze: "Fonzie",
                    full: "Fournie",
                    mrClean: "Rasé",
                    mrT: "Mr T",
                    pixie: "Pixie",
                    turban: "Turban",
                },
                colorField: "hairColor",
                colors: HAIR_COLORS,
                colorLabel: "Couleur des cheveux",
            },
            {
                id: "facialHair",
                label: "Barbe",
                icon: VenetianMask,
                variantField: "facialHair",
                variants: FACIAL_HAIR_VARIANTS,
                labels: { beard: "Barbe", scruff: "Naissante" },
                allowsNone: true,
                colorField: "facialHairColor",
                colors: HAIR_COLORS,
                colorLabel: "Couleur de la barbe",
            },
        ],
    },
    {
        id: "accessoires",
        label: "Accessoires",
        icon: Glasses,
        sections: [
            {
                id: "glasses",
                label: "Lunettes",
                icon: Glasses,
                variantField: "glasses",
                variants: GLASSES_VARIANTS,
                labels: { round: "Rondes", square: "Carrées" },
                allowsNone: true,
                colorField: "glassesColor",
                colors: GLASSES_COLORS,
                colorLabel: "Couleur des lunettes",
            },
            {
                id: "earrings",
                label: "Boucles d'oreilles",
                icon: Gem,
                variantField: "earrings",
                variants: EARRINGS_VARIANTS,
                labels: { hoop: "Créoles", stud: "Clous" },
                allowsNone: true,
                colorField: "earringColor",
                colors: EARRING_COLORS,
                colorLabel: "Couleur des boucles",
            },
            {
                id: "ears",
                label: "Oreilles",
                icon: Ear,
                variantField: "ears",
                variants: EARS_VARIANTS,
                labels: { attached: "Attachées", detached: "Décollées" },
            },
        ],
    },
    {
        id: "vetements",
        label: "Vêtements",
        icon: Shirt,
        sections: [
            {
                id: "clothes",
                label: "Haut",
                icon: Shirt,
                variantField: "clothes",
                variants: CLOTHES_VARIANTS,
                labels: { collared: "Col", crew: "T-shirt", open: "Ouvert" },
                colorField: "shirtColor",
                colors: SHIRT_COLORS,
                colorLabel: "Couleur du vêtement",
            },
        ],
    },
    {
        id: "couleurs",
        label: "Couleurs",
        icon: Palette,
        sections: [
            {
                id: "skin",
                label: "Peau",
                icon: Palette,
                colorField: "baseColor",
                colors: SKIN_COLORS,
                colorLabel: "Couleur de peau",
            },
            {
                id: "background",
                label: "Fond",
                icon: PaintBucket,
                colorField: "backgroundColor",
                colors: BACKGROUND_COLORS,
                colorLabel: "Couleur de fond",
            },
        ],
    },
];

/** Avatar de référence : base de l'éditeur (« Réinitialiser ») et rendu par défaut. */
export const DEFAULT_AVATAR_OPTIONS: AvatarOptions = {
    shape: "circle",
    hair: "fonze",
    hairColor: "#18181b",
    eyebrows: "down",
    eyebrowsColor: "#18181b",
    eyes: "eyes",
    eyesColor: "#000000",
    nose: "curve",
    mouth: "laughing",
    mouthColor: "#000000",
    facialHair: "none",
    facialHairColor: "#f472b6",
    glasses: "none",
    glassesColor: "#000000",
    earrings: "none",
    earringColor: "#38bdf8",
    ears: "attached",
    clothes: "collared",
    shirtColor: "#ef4444",
    baseColor: "#e8b18c",
    backgroundColor: "#ffffff",
};

/** Classe d'arrondi du conteneur selon la forme choisie. */
export function shapeClassName(shape: AvatarShape | undefined): string {
    switch (shape) {
        case "rounded":
            return "rounded-xl";
        case "square":
            return "rounded-none";
        default:
            return "rounded-full";
    }
}
