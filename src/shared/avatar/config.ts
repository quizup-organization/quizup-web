import { BACKGROUND_COLORS } from "./styles/palettes"
import {
  isAvatarStyleId,
  type AvatarOptions,
  type AvatarStyleId,
} from "./styles"

export const BASE_AVATAR_STYLE = "base" as const
export type BaseAvatarStyleId = typeof BASE_AVATAR_STYLE
export type AvatarPresetId = AvatarStyleId | BaseAvatarStyleId

/** Avatar de base : icône générique Lucide + fond libre. */
export interface BaseAvatarOptions {
  style: BaseAvatarStyleId
  backgroundColor?: string
}

export type AvatarConfig = AvatarOptions | BaseAvatarOptions

export const DEFAULT_BASE_AVATAR_BACKGROUND = BACKGROUND_COLORS[0]

const HEX_COLOR = /^#[0-9a-f]{6}$/i

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
        backgroundColor: isHexColor(options.backgroundColor)
          ? options.backgroundColor
          : DEFAULT_BASE_AVATAR_BACKGROUND,
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
  return config.backgroundColor ?? DEFAULT_BASE_AVATAR_BACKGROUND
}

/** Icône lisible : assombrit/eclaircit le même ton plutôt qu'un bleu fixe. */
export function baseAvatarForeground(background: string): string {
  const rgb = parseHex(background)
  if (!rgb) return "#3f3f46"
  const luminance = relativeLuminance(rgb)
  return mixHex(
    background,
    luminance > 0.42 ? "#111827" : "#f8fafc",
    luminance > 0.42 ? 0.72 : 0.68
  )
}

function parseHex(value: string): [number, number, number] | null {
  if (!HEX_COLOR.test(value)) return null
  return [
    Number.parseInt(value.slice(1, 3), 16),
    Number.parseInt(value.slice(3, 5), 16),
    Number.parseInt(value.slice(5, 7), 16),
  ]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (value: number) => {
    const v = value / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function mixHex(from: string, to: string, ratio: number): string {
  const a = parseHex(from)
  const b = parseHex(to)
  if (!a || !b) return "#3f3f46"
  const mix = a.map((value, index) =>
    Math.round(value + (b[index] - value) * ratio)
      .toString(16)
      .padStart(2, "0")
  )
  return `#${mix.join("")}`
}
