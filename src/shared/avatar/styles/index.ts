import { loreleiStyle } from "./lorelei";
import { micahStyle } from "./micah";
import { notionistsStyle } from "./notionists";
import type { AvatarOptions, AvatarStyleDefinition, AvatarStyleId } from "./types";

export type {
  AvatarOptions,
  AvatarStyleDefinition,
  AvatarStyleGroup,
  AvatarStyleId,
  AvatarStyleSection,
} from "./types";
export {
  NONE_LABEL,
  STYLE_GROUP_ID,
  humanizeVariant,
  numberedVariants,
} from "./labels";

export const AVATAR_STYLES: Record<AvatarStyleId, AvatarStyleDefinition> = {
  micah: micahStyle,
  lorelei: loreleiStyle,
  notionists: notionistsStyle,
};

/** Micah reste le style historique par défaut (rétrocompat des JSON sans `style`). */
export const DEFAULT_AVATAR_STYLE: AvatarStyleId = "micah";

export const AVATAR_STYLE_IDS = Object.keys(AVATAR_STYLES) as AvatarStyleId[];

export function isAvatarStyleId(value: unknown): value is AvatarStyleId {
  return typeof value === "string" && value in AVATAR_STYLES;
}

export function resolveAvatarStyleId(id: string | undefined): AvatarStyleId {
  return isAvatarStyleId(id) ? id : DEFAULT_AVATAR_STYLE;
}

export function getAvatarStyle(id: string | undefined): AvatarStyleDefinition {
  return AVATAR_STYLES[resolveAvatarStyleId(id)];
}

/** Preset de « Réinitialiser », `style` inclus seulement si ≠ défaut. */
export function defaultOptionsFor(id: AvatarStyleId): AvatarOptions {
  const { defaults } = AVATAR_STYLES[id];
  return id === DEFAULT_AVATAR_STYLE ? { ...defaults } : { ...defaults, style: id };
}
