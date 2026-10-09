import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "cn";
import { Card, CardContent } from "@/components/ui/card";
import {
  ColorSelector,
  ColorSelectorItem,
  ColorSelectorLabel,
  ColorSelectorList,
} from "@/components/motion/color-selector";
import { avatarDataUri } from "@/shared/avatar/avatar";
import {
  AVATAR_STYLES,
  AVATAR_STYLE_IDS,
  NONE_LABEL,
  STYLE_GROUP_ID,
  humanizeVariant,
  resolveAvatarStyleId,
  type AvatarOptions,
  type AvatarStyleGroup,
  type AvatarStyleId,
  type AvatarStyleSection,
} from "@/shared/avatar/styles";

interface AvatarEditorProps {
  /** Options en cours d'édition (contrôlé : l'aperçu est porté par le bandeau). */
  draft: AvatarOptions;
  onDraftChange: (draft: AvatarOptions) => void;
  /** Changement de style (réinitialise le brouillon sur le seed du nouveau style). */
  onStyleChange: (styleId: AvatarStyleId) => void;
  /** Groupe actif (onglets gérés par la page). */
  groupId: string;
  /** Groupes du style courant. */
  groups: AvatarStyleGroup[];
  /** Seed de prévisualisation des tuiles de style (userId/nom). */
  seed?: string;
  className?: string;
}

const TRANSPARENT_STYLE = {
  backgroundImage:
    "linear-gradient(135deg, transparent 44%, #ef4444 44%, #ef4444 56%, transparent 56%), linear-gradient(45deg, #e4e4e7 25%, #ffffff 25%, #ffffff 50%, #e4e4e7 50%, #e4e4e7 75%, #ffffff 75%)",
  backgroundSize: "100% 100%, 10px 10px",
};

type PickOption = (key: string, value: string) => void;

/**
 * Sections du groupe actif : chaque section (Yeux, Cheveux…) est englobée dans une `Card`.
 * Contrôlé : toute modification remonte via `onDraftChange`. L'onglet « Style » affiche le
 * sélecteur de style DiceBear (micah/lorelei/notionists).
 */
export function AvatarEditor({
  draft,
  onDraftChange,
  onStyleChange,
  groupId,
  groups,
  seed,
  className,
}: AvatarEditorProps) {
  const setOption = useCallback<PickOption>(
    (key, optionValue) => {
      onDraftChange({ ...draft, [key]: optionValue });
    },
    [draft, onDraftChange],
  );

  if (groupId === STYLE_GROUP_ID) {
    return (
      <div className={cn("flex flex-col gap-4", className)}>
        <StylePicker
          draft={draft}
          seed={seed}
          onStyleChange={onStyleChange}
        />
      </div>
    );
  }

  const group = groups.find((g) => g.id === groupId) ?? groups[0];

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {group.sections.map((section) => (
        <Card key={section.id} size="sm">
          <CardContent className="flex flex-col gap-3">
            <SectionBlock section={section} draft={draft} onPick={setOption} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StylePicker({
  draft,
  seed,
  onStyleChange,
}: {
  draft: AvatarOptions;
  seed?: string;
  onStyleChange: (styleId: AvatarStyleId) => void;
}) {
  const current = resolveAvatarStyleId(draft.style);

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Style
        </h3>
        <div className="grid grid-cols-3 gap-2 tablet-up:grid-cols-4 desktop:grid-cols-5">
          {AVATAR_STYLE_IDS.map((styleId) => {
            const style = AVATAR_STYLES[styleId];
            const selected = current === styleId;
            return (
              <button
                key={styleId}
                type="button"
                onClick={() => onStyleChange(styleId)}
                aria-pressed={selected}
                title={style.label}
                className={cn(
                  "group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                    : "border-border hover:border-foreground/30 hover:bg-muted/50",
                )}
              >
                <img
                  src={avatarDataUri({ style: styleId }, 72, seed)}
                  alt=""
                  className="size-14"
                />
                <span
                  className={cn(
                    "max-w-full truncate text-xs leading-tight",
                    selected ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  {style.label}
                </span>
                {selected && (
                  <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Check className="size-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Avatars générés avec DiceBear. Style Micah © Micah Lanier (CC BY 4.0) ;
          styles Lorelei et Notionists en CC0.
        </p>
      </CardContent>
    </Card>
  );
}

function SectionBlock({
  section,
  draft,
  onPick,
}: {
  section: AvatarStyleSection;
  draft: AvatarOptions;
  onPick: PickOption;
}) {
  const field = section.variantField;
  const variants = section.allowsNone
    ? ["none", ...(section.variants ?? [])]
    : [...(section.variants ?? [])];

  return (
    <section className="flex flex-col gap-3">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <section.icon className="size-3.5" />
        {section.label}
      </h3>

      {field && (
        <div className="grid grid-cols-3 gap-2 tablet-up:grid-cols-4 desktop:grid-cols-5">
          {variants.map((variant) => {
            const selected = draft[field] === variant;
            const tile: AvatarOptions = { ...draft, [field]: variant };
            return (
              <VariantTile
                key={variant}
                dataUri={avatarDataUri(tile, 72)}
                label={
                  variant === "none"
                    ? NONE_LABEL
                    : (section.labels?.[variant] ?? humanizeVariant(variant))
                }
                selected={selected}
                field={field}
                value={variant}
                onPick={onPick}
              />
            );
          })}
        </div>
      )}

      {section.colorField && (
        <ColorSelector
          value={draft[section.colorField] ?? ""}
          onValueChange={(value) => onPick(section.colorField!, value)}
        >
          <ColorSelectorLabel className="mb-4 text-xs font-normal text-muted-foreground">
            {section.colorLabel ?? "Couleur"}
          </ColorSelectorLabel>
          <ColorSelectorList className="gap-2 p-0">
            {(section.colors ?? []).map((color) => (
              <ColorSelectorItem
                key={color || "transparent"}
                value={color}
                color={color || "transparent"}
                label={color || "Transparent"}
                dotStyle={color ? undefined : TRANSPARENT_STYLE}
              />
            ))}
          </ColorSelectorList>
        </ColorSelector>
      )}
    </section>
  );
}

const VariantTile = memo(function VariantTile({
  dataUri,
  label,
  selected,
  field,
  value,
  onPick,
}: {
  dataUri: string;
  label: string;
  selected: boolean;
  field: string;
  value: string;
  onPick: PickOption;
}) {
  return (
    <button
      type="button"
      onClick={() => onPick(field, value)}
      aria-pressed={selected}
      title={label}
      className={cn(
        "group relative flex flex-col items-center gap-1 rounded-lg border p-1.5 transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/40"
          : "border-border hover:border-foreground/30 hover:bg-muted/50",
      )}
    >
      <img src={dataUri} alt="" className="size-14" />
      <span
        className={cn(
          "max-w-full truncate text-xs leading-tight",
          selected ? "font-semibold text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
      {selected && (
        <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </span>
      )}
    </button>
  );
});
