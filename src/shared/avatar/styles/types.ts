import type { StyleDefinition } from "@dicebear/core";
import type { LucideIcon } from "lucide-react";

export type AvatarStyleId = "micah" | "lorelei" | "notionists";

/**
 * Options d'avatar persistées : le style (défaut `micah` si absent) et une valeur
 * par attribut variant/couleur. Le jeu de champs dépend du style
 * (cf. `AvatarStyleDefinition.variantFields` / `colorFields`).
 */
export type AvatarOptions = { style?: AvatarStyleId } & Record<string, string | undefined>;

export interface AvatarStyleSection {
  id: string;
  label: string;
  icon: LucideIcon;
  variantField?: string;
  variants?: readonly string[];
  /** Libellés FR par variante (sinon libellé humanisé). */
  labels?: Record<string, string>;
  allowsNone?: boolean;
  colorField?: string;
  colors?: readonly string[];
  colorLabel?: string;
}

export interface AvatarStyleGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  sections: AvatarStyleSection[];
}

export interface AvatarStyleDefinition {
  id: AvatarStyleId;
  label: string;
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
