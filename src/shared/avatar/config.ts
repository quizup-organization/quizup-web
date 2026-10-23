import type { TranslationKey } from "@/lib/i18n/types"
import {
  isAvatarStyleId,
  type AvatarOptions,
  type AvatarStyleId,
} from "./styles"

export const BASE_AVATAR_STYLE = "base" as const
export const BASE_BACKGROUND_GROUP_ID = "base-background"
export type BaseAvatarStyleId = typeof BASE_AVATAR_STYLE
export type AvatarPresetId = AvatarStyleId | BaseAvatarStyleId

/** Avatar de base : icône générique Lucide + fond WhatsApp light/dark. */
export interface BaseAvatarOptions {
  style: BaseAvatarStyleId
  /** Clé de palette (`gray`, `blue`…) ; les anciens hex sont normalisés à la lecture. */
  backgroundColor?: string
}

export type AvatarConfig = AvatarOptions | BaseAvatarOptions

export interface BaseAvatarBackground {
  id: string
  labelKey: TranslationKey
  light: string
  dark: string
}

/** Palette pastel inspirée des fonds d'avatar WhatsApp. */
export const BASE_AVATAR_BACKGROUNDS: readonly BaseAvatarBackground[] = [
  {
    id: "gray",
    labelKey: "avatar.backgrounds.gray",
    light: "#e4e4e7",
    dark: "#3f3f46",
  },
  {
    id: "blue",
    labelKey: "avatar.backgrounds.blue",
    light: "#dbeafe",
    dark: "#1e3a5f",
  },
  {
    id: "teal",
    labelKey: "avatar.backgrounds.teal",
    light: "#ccfbf1",
    dark: "#134e4a",
  },
  {
    id: "green",
    labelKey: "avatar.backgrounds.green",
    light: "#dcfce7",
    dark: "#14532d",
  },
  {
    id: "yellow",
    labelKey: "avatar.backgrounds.yellow",
    light: "#fef9c3",
    dark: "#713f12",
  },
  {
    id: "orange",
    labelKey: "avatar.backgrounds.orange",
    light: "#ffedd5",
    dark: "#7c2d12",
  },
  {
    id: "pink",
    labelKey: "avatar.backgrounds.pink",
    light: "#fce7f3",
    dark: "#831843",
  },
  {
    id: "purple",
    labelKey: "avatar.backgrounds.purple",
    light: "#ede9fe",
    dark: "#4c1d95",
  },
  {
    id: "red",
    labelKey: "avatar.backgrounds.red",
    light: "#fee2e2",
    dark: "#7f1d1d",
  },
]

export const DEFAULT_BASE_AVATAR_BACKGROUND = "gray"

const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function resolveBaseAvatarBackground(
  value: string | undefined
): BaseAvatarBackground {
  const normalized = value?.toLowerCase()
  return (
    BASE_AVATAR_BACKGROUNDS.find(
      (background) =>
        background.id === normalized ||
        background.light.toLowerCase() === normalized ||
        background.dark.toLowerCase() === normalized
    ) ?? BASE_AVATAR_BACKGROUNDS[0]
  )
}

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR.test(value)
}

export function parseAvatarConfig(
  json: string | undefined | null
): AvatarConfig | undefined {
  if (!json) return undefined
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return undefined
    }
    const options = parsed as Record<string, unknown>
    if (options.style === BASE_AVATAR_STYLE) {
      return {
        style: BASE_AVATAR_STYLE,
        backgroundColor: resolveBaseAvatarBackground(
          typeof options.backgroundColor === "string"
            ? options.backgroundColor
            : undefined
        ).id,
      }
    }
    // Les options DiceBear historiques ne portent pas toujours `style` : Micah par défaut.
    if (!isAvatarStyleId(options.style)) delete options.style
    return options as AvatarOptions
  } catch {
    return undefined
  }
}

export function isBaseAvatarConfig(
  config: AvatarConfig | undefined
): config is BaseAvatarOptions {
  return config?.style === BASE_AVATAR_STYLE
}

export function baseAvatarBackground(config: BaseAvatarOptions): string {
  return resolveBaseAvatarBackground(config.backgroundColor).id
}
