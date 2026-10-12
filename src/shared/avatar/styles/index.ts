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
  NONE_LABEL_KEY,
  STYLE_GROUP_ID,
  humanizeVariant,
  numberedVariants,
} from "./labels";
export type { HumanizedVariant } from "./labels";

export const AVATAR_STYLES: Record<AvatarStyleId, AvatarStyleDefinition> = {
  micah: micahStyle,
  lorelei: loreleiStyle,
  notionists: notionistsStyle,
};

/** Micah reste le style historique par défaut (rétrocompat des JSON sans `style`). */
export const DEFAULT_AVATAR_STYLE: AvatarStyleId = "micah";

/**
 * Styles **actifs** : proposés dans l'éditeur et acceptés à la lecture des options
 * persistées. Lorelei et notionists sont désactivés pour le moment (définitions
 * conservées dans le registry pour réactivation).
 */
export const AVATAR_STYLE_IDS: AvatarStyleId[] = ["micah"];

export function isAvatarStyleId(value: unknown): value is AvatarStyleId {
  return typeof value === "string" && value in AVATAR_STYLES;
}

/** Style actif — les styles désactivés retombent sur le style par défaut. */
export function isActiveAvatarStyleId(value: unknown): value is AvatarStyleId {
  return typeof value === "string" && (AVATAR_STYLE_IDS as string[]).includes(value);
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
