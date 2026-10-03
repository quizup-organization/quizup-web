import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormRow, FormSection } from "@/shared/components/form-section";
import { EmojiPickerField } from "@/shared/components/emoji-picker-field";
import { TopicIcon } from "@/shared/components/topic-icon";
import { categoryColor } from "@/shared/utils/categories";
import { useTheme } from "@/features/shell";
import { useTopicCategories, type TopicCard } from "@/features/topics";
import type { TopicPatch } from "../domain/topic-authoring";

interface TopicSettingsCardProps {
  topic: TopicCard;
  saving: boolean;
  onSave: (patch: TopicPatch) => void;
}

function normalize(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Édition champ par champ du sujet — seuls les champs modifiés sont envoyés au BFF. */
export function TopicSettingsCard({ topic, saving, onSave }: TopicSettingsCardProps) {
  const categories = useTopicCategories();
  const { theme } = useTheme();
  const [name, setName] = useState(topic.name);
  const [description, setDescription] = useState(topic.description ?? "");
  const [category, setCategory] = useState(topic.category ?? "");
  const [emoji, setEmoji] = useState(topic.emoji ?? "");
  const [color, setColor] = useState<string | null>(topic.color);
  const [imageUrl, setImageUrl] = useState(topic.imageUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  const colorValue = color ?? categoryColor(category);
  const categoryItems = (categories.data ?? []).map((item) => ({
    value: item.category,
    label: item.label,
  }));

  const patch = (): TopicPatch => {
    const next: TopicPatch = {};
    if (name.trim() !== topic.name) next.name = name.trim();
    if (normalize(description) !== (topic.description ?? null))
      next.description = normalize(description);
    if (category && category !== topic.category) next.category = category;
    if (normalize(emoji) !== (topic.emoji ?? null)) next.emoji = normalize(emoji);
    if (color !== (topic.color ?? null)) next.color = color;
    if (normalize(imageUrl) !== (topic.imageUrl ?? null))
      next.imageUrl = normalize(imageUrl);
    return next;
  };

  const dirty = Object.keys(patch()).length > 0;

  const submit = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Le nom est requis.");
      return;
    }
    if (trimmedName.length > 25) {
      setError("Le nom dépasse 25 caractères.");
      return;
    }
    if (description.trim().length > 500) {
      setError("La description dépasse 500 caractères.");
      return;
    }
    const normalizedImage = normalize(imageUrl);
    if (normalizedImage && !/^https?:\/\/.+/.test(normalizedImage)) {
      setError("L'URL de l'image doit commencer par http(s)://.");
      return;
    }
    setError(null);
    onSave(patch());
  };

  return (
    <FormSection
      title="Détails du sujet"
      sub="Chaque champ est enregistré séparément."
    >
      <FormRow
        label="Aperçu"
        description="Rendu de la carte du catalogue."
        controlClassName="flex sm:justify-end"
      >
        <TopicIcon
          topic={{
            emoji: normalize(emoji),
            color,
            imageUrl: normalize(imageUrl),
            category,
          }}
          size={56}
          className="rounded-[18px] shadow-lg"
        />
      </FormRow>

      <FormRow
        label="Nom"
        description="25 caractères max — affiché dans le catalogue."
        htmlFor="topic-name"
      >
        <Input
          id="topic-name"
          value={name}
          maxLength={25}
          onChange={(event) => setName(event.target.value)}
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground">
          {name.length}/25
        </p>
      </FormRow>

      <FormRow
        stacked
        label="Description"
        description="500 caractères max — présentée sur la fiche du sujet."
        htmlFor="topic-description"
      >
        <Textarea
          id="topic-description"
          value={description}
          maxLength={500}
          rows={3}
          onChange={(event) => setDescription(event.target.value)}
        />
        <p className="mt-1.5 text-right text-xs text-muted-foreground">
          {description.length}/500
        </p>
      </FormRow>

      <FormRow
        label="Catégorie"
        description="Détermine l'icône de repli et la couleur automatique."
      >
        <Select
          items={categoryItems}
          value={category}
          onValueChange={(value) => setCategory(value ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choisir une catégorie" />
          </SelectTrigger>
          <SelectContent>
            {categoryItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormRow>

      <FormRow
        label="Emoji"
        description="Optionnel — affiché si le sujet n'a pas d'illustration."
      >
        <EmojiPickerField
          theme={theme}
          value={normalize(emoji)}
          onChange={(value) => setEmoji(value ?? "")}
        />
      </FormRow>

      <FormRow
        label="Couleur d'accent"
        description="Teinte des cartes et de l'arène ; « Auto » reprend la couleur de la catégorie."
        controlClassName="flex items-center gap-2"
      >
        <input
          type="color"
          aria-label="Couleur d'accent"
          className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
          value={colorValue}
          onChange={(event) => setColor(event.target.value)}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setColor(null)}
          disabled={color === null}
        >
          Auto
        </Button>
      </FormRow>

      <FormRow
        label="Illustration"
        description="URL http(s) d'une image de couverture (Wikimedia, etc.)."
        htmlFor="topic-image"
      >
        <Input
          id="topic-image"
          value={imageUrl}
          placeholder="https://…"
          onChange={(event) => setImageUrl(event.target.value)}
        />
      </FormRow>

      {error && <p className="pt-3 text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-4">
        <Button
          variant="outline"
          onClick={() => {
            setName(topic.name);
            setDescription(topic.description ?? "");
            setCategory(topic.category ?? "");
            setEmoji(topic.emoji ?? "");
            setColor(topic.color);
            setImageUrl(topic.imageUrl ?? "");
            setError(null);
          }}
          disabled={!dirty || saving}
        >
          Annuler
        </Button>
        <Button onClick={submit} disabled={!dirty || saving}>
          {saving ? "Enregistrement…" : "Enregistrer"}
        </Button>
      </div>
    </FormSection>
  );
}
