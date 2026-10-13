import loreleiDefinition from "@dicebear/styles/lorelei.json"
import type { StyleDefinition } from "@dicebear/core"
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
} from "lucide-react"
import { collectPalettes, collectVariants } from "./derive"
import { numberedVariants } from "./labels"
import {
  BACKGROUND_COLORS,
  HAIR_COLORS,
  INK_COLORS,
  SKIN_COLORS,
} from "./palettes"
import type { AvatarStyleDefinition, AvatarStyleGroup } from "./types"

const HEAD_VARIANTS = numberedVariants("variant", 4)
const EYES_VARIANTS = numberedVariants("variant", 24)
const EYEBROWS_VARIANTS = numberedVariants("variant", 13)
const NOSE_VARIANTS = numberedVariants("variant", 6)
const MOUTH_VARIANTS = [
  ...numberedVariants("happy", 18),
  ...numberedVariants("sad", 9),
]
const FRECKLES_VARIANTS = ["variant01"] as const
const HAIR_VARIANTS = numberedVariants("variant", 48)
const BEARD_VARIANTS = numberedVariants("variant", 2)
const GLASSES_VARIANTS = numberedVariants("variant", 5)
const EARRINGS_VARIANTS = numberedVariants("variant", 3)
const HAIR_ACCESSORIES_VARIANTS = ["flowers"] as const

const HEAD_LABEL_KEYS = {
  variant01: "avatar.options.head1",
  variant02: "avatar.options.head2",
  variant03: "avatar.options.head3",
  variant04: "avatar.options.head4",
} as const

const groups: AvatarStyleGroup[] = [
  {
    id: "visage",
    labelKey: "avatar.groups.face",
    icon: Smile,
    sections: [
      {
        id: "head",
        labelKey: "avatar.sections.head",
        icon: CircleUserRound,
        variantField: "head",
        variants: HEAD_VARIANTS,
        labelKeys: HEAD_LABEL_KEYS,
      },
      {
        id: "eyes",
        labelKey: "avatar.sections.eyes",
        icon: Eye,
        variantField: "eyes",
        variants: EYES_VARIANTS,
      },
      {
        id: "eyebrows",
        labelKey: "avatar.sections.eyebrows",
        icon: Brush,
        variantField: "eyebrows",
        variants: EYEBROWS_VARIANTS,
      },
      {
        id: "nose",
        labelKey: "avatar.sections.nose",
        icon: Triangle,
        variantField: "nose",
        variants: NOSE_VARIANTS,
      },
      {
        id: "mouth",
        labelKey: "avatar.sections.mouth",
        icon: Smile,
        variantField: "mouth",
        variants: MOUTH_VARIANTS,
      },
      {
        id: "freckles",
        labelKey: "avatar.sections.freckles",
        icon: Sparkles,
        variantField: "freckles",
        variants: FRECKLES_VARIANTS,
        labelKeys: { variant01: "avatar.options.freckles" },
        allowsNone: true,
      },
    ],
  },
  {
    id: "cheveux",
    labelKey: "avatar.groups.hair",
    icon: Scissors,
    sections: [
      {
        id: "hair",
        labelKey: "avatar.sections.hair",
        icon: Scissors,
        variantField: "hair",
        variants: HAIR_VARIANTS,
        allowsNone: true,
        colorField: "hairColor",
        colors: HAIR_COLORS,
        colorLabelKey: "avatar.colors.hair",
      },
      {
        id: "beard",
        labelKey: "avatar.sections.beard",
        icon: VenetianMask,
        variantField: "beard",
        variants: BEARD_VARIANTS,
        labelKeys: {
          variant01: "avatar.options.beard",
          variant02: "avatar.options.stubble",
        },
        allowsNone: true,
      },
    ],
  },
  {
    id: "accessoires",
    labelKey: "avatar.groups.accessories",
    icon: Glasses,
    sections: [
      {
        id: "glasses",
        labelKey: "avatar.sections.glasses",
        icon: Glasses,
        variantField: "glasses",
        variants: GLASSES_VARIANTS,
        allowsNone: true,
      },
      {
        id: "earrings",
        labelKey: "avatar.sections.earrings",
        icon: Gem,
        variantField: "earrings",
        variants: EARRINGS_VARIANTS,
        allowsNone: true,
      },
      {
        id: "hairAccessories",
        labelKey: "avatar.sections.hairAccessories",
        icon: Flower2,
        variantField: "hairAccessories",
        variants: HAIR_ACCESSORIES_VARIANTS,
        labelKeys: { flowers: "avatar.options.flowers" },
        allowsNone: true,
      },
    ],
  },
  {
    id: "couleurs",
    labelKey: "avatar.groups.colors",
    icon: Palette,
    sections: [
      {
        id: "skin",
        labelKey: "avatar.sections.skin",
        icon: Palette,
        colorField: "skinColor",
        colors: SKIN_COLORS,
        colorLabelKey: "avatar.colors.skin",
      },
      {
        id: "outline",
        labelKey: "avatar.sections.outline",
        icon: Brush,
        colorField: "outlineColor",
        colors: INK_COLORS,
        colorLabelKey: "avatar.colors.outline",
      },
      {
        id: "background",
        labelKey: "avatar.sections.background",
        icon: PaintBucket,
        colorField: "backgroundColor",
        colors: BACKGROUND_COLORS,
        colorLabelKey: "avatar.colors.background",
      },
    ],
  },
]

export const loreleiStyle: AvatarStyleDefinition = {
  id: "lorelei",
  labelKey: "avatar.styles.lorelei",
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
}
