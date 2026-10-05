import micahDefinition from "@dicebear/styles/micah.json";
import type { StyleDefinition } from "@dicebear/core";
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
import { collectPalettes, collectVariants } from "./derive";
import {
  BACKGROUND_COLORS,
  BROW_COLORS,
  EARRING_COLORS,
  EYES_COLORS,
  GLASSES_COLORS,
  HAIR_COLORS,
  MOUTH_COLORS,
  SHIRT_COLORS,
  SKIN_COLORS,
} from "./palettes";
import type { AvatarStyleDefinition, AvatarStyleGroup } from "./types";

const HAIR_VARIANTS = [
  "dannyPhantom",
  "dougFunny",
  "fonze",
  "full",
  "mrClean",
  "mrT",
  "pixie",
  "turban",
] as const;

const EYEBROWS_VARIANTS = ["down", "eyelashesDown", "eyelashesUp", "up"] as const;

const EYES_VARIANTS = ["eyes", "eyesShadow", "round", "smiling", "smilingShadow"] as const;

const NOSE_VARIANTS = ["curve", "pointed", "tound"] as const;

const MOUTH_VARIANTS = [
  "frown",
  "laughing",
  "nervous",
  "pucker",
  "sad",
  "smile",
  "smirk",
  "surprised",
] as const;

const FACIAL_HAIR_VARIANTS = ["beard", "scruff"] as const;

const GLASSES_VARIANTS = ["round", "square"] as const;

const EARRINGS_VARIANTS = ["hoop", "stud"] as const;

const EARS_VARIANTS = ["attached", "detached"] as const;

const CLOTHES_VARIANTS = ["collared", "crew", "open"] as const;

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

export const micahStyle: AvatarStyleDefinition = {
  id: "micah",
  label: "Micah",
  definition: micahDefinition as StyleDefinition,
  variantFields: [
    "hair",
    "eyebrows",
    "eyes",
    "nose",
    "mouth",
    "facialHair",
    "glasses",
    "earrings",
    "ears",
    "clothes",
  ],
  optionalFields: ["facialHair", "glasses", "earrings"],
  colorFields: [
    "hairColor",
    "eyebrowsColor",
    "eyesColor",
    "mouthColor",
    "facialHairColor",
    "glassesColor",
    "earringColor",
    "shirtColor",
    "baseColor",
    "backgroundColor",
  ],
  variants: collectVariants(groups),
  palettes: collectPalettes(groups),
  groups,
  defaults: {
    hair: "fonze",
    hairColor: "#18181b",
    eyebrows: "up",
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
  },
};
