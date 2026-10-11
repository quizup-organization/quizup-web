import type { StyleDefinition } from "@dicebear/core";
import type { LucideIcon } from "lucide-react";
import type { TranslationKey } from "@/lib/i18n/types";

export type AvatarStyleId = "micah" | "lorelei" | "notionists";

/**
 * Options d'avatar persistées : le style (défaut `micah` si absent) et une valeur
 * par attribut variant/couleur. Le jeu de champs dépend du style
 * (cf. `AvatarStyleDefinition.variantFields` / `colorFields`).
 */
export type AvatarOptions = { style?: AvatarStyleId } & Record<string, string | undefined>;

export interface AvatarStyleSection {
  id: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  variantField?: string;
  variants?: readonly string[];
  /** Clés de traduction par variante (sinon libellé humanisé). */
  labelKeys?: Record<string, TranslationKey>;
  allowsNone?: boolean;
  colorField?: string;
  colors?: readonly string[];
  colorLabelKey?: TranslationKey;
}

export interface AvatarStyleGroup {
  id: string;
  labelKey: TranslationKey;
  icon: LucideIcon;
  sections: AvatarStyleSection[];
}

export interface AvatarStyleDefinition {
  id: AvatarStyleId;
  labelKey: TranslationKey;
  /** Définition DiceBear du style (JSON importé). */
  definition: StyleDefinition;
  /** Composants variants gérés (`<field>Variant`). */
  variantFields: readonly string[];
  /** Composants pouvant être retirés (`<field>Probability: 0`). */
  optionalFields: readonly string[];
  /** Options couleur gérées (`<field>` = nom d'option DiceBear, ex. `hairColor`). */
  colorFields: readonly string[];
  /** Variantes disponibles par champ (dérivé des groupes). */
  variants: Record<string, readonly string[]>;
  /** Palettes proposées par champ couleur (dérivé des groupes). */
  palettes: Record<string, readonly string[]>;
  groups: AvatarStyleGroup[];
  /** Preset de référence (« Réinitialiser »), sans `style`. */
  defaults: AvatarOptions;
}
