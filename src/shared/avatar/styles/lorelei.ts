import loreleiDefinition from "@dicebear/styles/lorelei.json";
import type { StyleDefinition } from "@dicebear/core";
import {
  Brush,
  CircleUserRound,
  Eye,
  Flower2,
  Gem,
  Glasses,
  PaintBucket,
  Palette,
  Scissors,
  Smile,
  Sparkles,
  Triangle,
  VenetianMask,
} from "lucide-react";
import { collectPalettes, collectVariants } from "./derive";
import { numberedVariants } from "./labels";
import {
  BACKGROUND_COLORS,
  HAIR_COLORS,
  INK_COLORS,
  SKIN_COLORS,
} from "./palettes";
import type { AvatarStyleDefinition, AvatarStyleGroup } from "./types";

const HEAD_VARIANTS = numberedVariants("variant", 4);
const EYES_VARIANTS = numberedVariants("variant", 24);
const EYEBROWS_VARIANTS = numberedVariants("variant", 13);
const NOSE_VARIANTS = numberedVariants("variant", 6);
const MOUTH_VARIANTS = [
  ...numberedVariants("happy", 18),
  ...numberedVariants("sad", 9),
];
const FRECKLES_VARIANTS = ["variant01"] as const;
const HAIR_VARIANTS = numberedVariants("variant", 48);
const BEARD_VARIANTS = numberedVariants("variant", 2);
const GLASSES_VARIANTS = numberedVariants("variant", 5);
const EARRINGS_VARIANTS = numberedVariants("variant", 3);
const HAIR_ACCESSORIES_VARIANTS = ["flowers"] as const;

const HEAD_LABELS = {
  variant01: "Forme 1",
  variant02: "Forme 2",
  variant03: "Forme 3",
  variant04: "Forme 4",
};

const groups: AvatarStyleGroup[] = [
  {
    id: "visage",
    label: "Visage",
    icon: Smile,
    sections: [
      {
        id: "head",
        label: "Tête",
        icon: CircleUserRound,
        variantField: "head",
        variants: HEAD_VARIANTS,
        labels: HEAD_LABELS,
      },
      {
        id: "eyes",
        label: "Yeux",
        icon: Eye,
        variantField: "eyes",
        variants: EYES_VARIANTS,
      },
      {
        id: "eyebrows",
        label: "Sourcils",
        icon: Brush,
        variantField: "eyebrows",
        variants: EYEBROWS_VARIANTS,
      },
      {
        id: "nose",
        label: "Nez",
        icon: Triangle,
        variantField: "nose",
        variants: NOSE_VARIANTS,
      },
      {
        id: "mouth",
        label: "Bouche",
        icon: Smile,
        variantField: "mouth",
        variants: MOUTH_VARIANTS,
      },
      {
        id: "freckles",
        label: "Taches de rousseur",
        icon: Sparkles,
        variantField: "freckles",
        variants: FRECKLES_VARIANTS,
        labels: { variant01: "Taches" },
        allowsNone: true,
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
        allowsNone: true,
        colorField: "hairColor",
        colors: HAIR_COLORS,
        colorLabel: "Couleur des cheveux",
      },
      {
        id: "beard",
        label: "Barbe",
        icon: VenetianMask,
        variantField: "beard",
        variants: BEARD_VARIANTS,
        labels: { variant01: "Barbe", variant02: "Naissante" },
        allowsNone: true,
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
        allowsNone: true,
      },
      {
        id: "earrings",
        label: "Boucles d'oreilles",
        icon: Gem,
        variantField: "earrings",
        variants: EARRINGS_VARIANTS,
        allowsNone: true,
      },
      {
        id: "hairAccessories",
        label: "Accessoire de cheveux",
        icon: Flower2,
        variantField: "hairAccessories",
        variants: HAIR_ACCESSORIES_VARIANTS,
        labels: { flowers: "Fleurs" },
        allowsNone: true,
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
        colorField: "skinColor",
        colors: SKIN_COLORS,
        colorLabel: "Couleur de peau",
      },
      {
        id: "outline",
        label: "Trait",
        icon: Brush,
        colorField: "outlineColor",
        colors: INK_COLORS,
        colorLabel: "Couleur du trait",
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

export const loreleiStyle: AvatarStyleDefinition = {
  id: "lorelei",
  label: "Lorelei",
  definition: loreleiDefinition as StyleDefinition,
  variantFields: [
    "head",
    "eyes",
    "eyebrows",
    "nose",
    "mouth",
    "freckles",
    "hair",
    "beard",
    "glasses",
    "earrings",
    "hairAccessories",
  ],
  optionalFields: [
    "freckles",
    "hair",
    "beard",
    "glasses",
    "earrings",
    "hairAccessories",
  ],
  colorFields: [
    "hairColor",
    "eyesColor",
    "eyebrowsColor",
    "noseColor",
    "mouthColor",
    "frecklesColor",
    "skinColor",
    "outlineColor",
    "glassesColor",
    "earringsColor",
    "hairAccessoriesColor",
    "backgroundColor",
  ],
  variants: collectVariants(groups),
  palettes: collectPalettes(groups),
  groups,
  defaults: {
    head: "variant01",
    eyes: "variant01",
    eyebrows: "variant01",
    nose: "variant01",
    mouth: "happy01",
    freckles: "none",
    hair: "variant01",
    beard: "none",
    glasses: "none",
    earrings: "none",
    hairAccessories: "none",
    hairColor: "#18181b",
    eyesColor: "#000000",
    eyebrowsColor: "#18181b",
    noseColor: "#18181b",
    mouthColor: "#18181b",
    frecklesColor: "#b45309",
    skinColor: "#f9c9b6",
    outlineColor: "#18181b",
    glassesColor: "#18181b",
    earringsColor: "#facc15",
    hairAccessoriesColor: "#ef4444",
    backgroundColor: "",
  },
};
