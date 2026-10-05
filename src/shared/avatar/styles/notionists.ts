import notionistsDefinition from "@dicebear/styles/notionists.json";
import type { StyleDefinition } from "@dicebear/core";
import {
  Brush,
  Eye,
  Glasses,
  Hand,
  PaintBucket,
  Palette,
  PenLine,
  Scissors,
  Shirt,
  Smile,
  Sparkles,
  Triangle,
  VenetianMask,
} from "lucide-react";
import { collectPalettes, collectVariants } from "./derive";
import { numberedVariants } from "./labels";
import {
  BACKGROUND_COLORS,
  INK_COLORS,
  PAPER_COLORS,
} from "./palettes";
import type { AvatarStyleDefinition, AvatarStyleGroup } from "./types";

const EYEBROWS_VARIANTS = numberedVariants("variant", 13);
const EYES_VARIANTS = numberedVariants("variant", 5);
const NOSE_VARIANTS = numberedVariants("variant", 20);
const MOUTH_VARIANTS = numberedVariants("variant", 30);
const HAIR_VARIANTS = ["hat", ...numberedVariants("variant", 63)];
const BEARD_VARIANTS = numberedVariants("variant", 12);
const CLOTHES_VARIANTS = numberedVariants("variant", 25);
const CLOTHES_GRAPHIC_VARIANTS = ["electric", "galaxy", "saturn"] as const;
const GESTURE_VARIANTS = [
  "hand",
  "handPhone",
  "ok",
  "okLongArm",
  "point",
  "pointLongArm",
  "waveLongArm",
  "waveLongArms",
  "waveOkLongArms",
  "wavePointLongArms",
] as const;
const GLASSES_VARIANTS = numberedVariants("variant", 11);

const GESTURE_LABELS = {
  hand: "Main",
  handPhone: "Téléphone",
  ok: "OK",
  okLongArm: "OK (bras)",
  point: "Pointe",
  pointLongArm: "Pointe (bras)",
  waveLongArm: "Salut",
  waveLongArms: "Salut (2 bras)",
  waveOkLongArms: "Salut OK",
  wavePointLongArms: "Salut pointe",
};

const groups: AvatarStyleGroup[] = [
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
        labels: { hat: "Chapeau" },
        allowsNone: true,
      },
      {
        id: "beard",
        label: "Barbe",
        icon: VenetianMask,
        variantField: "beard",
        variants: BEARD_VARIANTS,
        allowsNone: true,
      },
    ],
  },
  {
    id: "tenue",
    label: "Tenue",
    icon: Shirt,
    sections: [
      {
        id: "clothes",
        label: "Haut",
        icon: Shirt,
        variantField: "clothes",
        variants: CLOTHES_VARIANTS,
      },
      {
        id: "clothesGraphic",
        label: "Motif",
        icon: Sparkles,
        variantField: "clothesGraphic",
        variants: CLOTHES_GRAPHIC_VARIANTS,
        labels: { electric: "Éclair", galaxy: "Galaxie", saturn: "Saturne" },
        allowsNone: true,
      },
      {
        id: "gesture",
        label: "Geste",
        icon: Hand,
        variantField: "gesture",
        variants: GESTURE_VARIANTS,
        labels: GESTURE_LABELS,
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
    ],
  },
  {
    id: "couleurs",
    label: "Couleurs",
    icon: Palette,
    sections: [
      {
        id: "ink",
        label: "Encre",
        icon: PenLine,
        colorField: "inkColor",
        colors: INK_COLORS,
        colorLabel: "Couleur d'encre",
      },
      {
        id: "paper",
        label: "Papier",
        icon: PaintBucket,
        colorField: "paperColor",
        colors: PAPER_COLORS,
        colorLabel: "Couleur du papier",
      },
      {
        id: "background",
        label: "Fond",
        icon: Palette,
        colorField: "backgroundColor",
        colors: BACKGROUND_COLORS,
        colorLabel: "Couleur de fond",
      },
    ],
  },
];

export const notionistsStyle: AvatarStyleDefinition = {
  id: "notionists",
  label: "Notionists",
  definition: notionistsDefinition as StyleDefinition,
  variantFields: [
    "head",
    "eyes",
    "eyebrows",
    "nose",
    "mouth",
    "hair",
    "beard",
    "clothes",
    "clothesGraphic",
    "gesture",
    "glasses",
  ],
  optionalFields: [
    "hair",
    "beard",
    "clothesGraphic",
    "gesture",
    "glasses",
  ],
  colorFields: ["inkColor", "paperColor", "backgroundColor"],
  variants: collectVariants(groups),
  palettes: collectPalettes(groups),
  groups,
  defaults: {
    head: "variant01",
    eyes: "variant01",
    eyebrows: "variant01",
    nose: "variant01",
    mouth: "variant01",
    hair: "variant01",
    beard: "none",
    clothes: "variant01",
    clothesGraphic: "none",
    gesture: "hand",
    glasses: "none",
    inkColor: "#18181b",
    paperColor: "#ffffff",
    backgroundColor: "",
  },
};
