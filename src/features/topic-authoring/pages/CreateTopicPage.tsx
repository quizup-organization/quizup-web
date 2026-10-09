import { Link, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
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
import { PageContainer, useTheme } from "@/features/shell";
import { EmojiPickerField } from "@/shared/components/emoji-picker-field";
import { FormRow, FormSection } from "@/shared/components/form-section";
import { TopicIcon } from "@/shared/components/topic-icon";
import { categoryColor } from "@/shared/utils/categories";
import { useTopicCategories } from "@/features/topics";
import { useCreateTopic } from "../hooks/useTopicAuthoring";

const topicSchema = z.object({
  name: z.string().trim().min(1, "Nom requis").max(25, "25 caractères max"),
  description: z.string().max(500, "500 caractères max"),
  category: z.string().min(1, "Catégorie requise"),
  emoji: z.string().max(16, "16 caractères max"),
  color: z.string(),
  imageUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^https?:\/\/.+/.test(value),
      "URL http(s) requise",
    ),
});

type TopicValues = z.infer<typeof topicSchema>;

export function CreateTopicPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const categories = useTopicCategories();
  const createTopic = useCreateTopic();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TopicValues>({
    resolver: zodResolver(topicSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      emoji: "",
      color: "#6366f1",
      imageUrl: "",
    },
  });

  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" });
  const category = useWatch({ control, name: "category" });
  const emoji = useWatch({ control, name: "emoji" });
  const color = useWatch({ control, name: "color" });
  const imageUrl = useWatch({ control, name: "imageUrl" });

  const onSubmit = handleSubmit(async (form) => {
    const created = await createTopic.mutateAsync({
      name: form.name.trim(),
      description: form.description.trim() || null,
      category: form.category,
      emoji: form.emoji.trim() || null,
      color: form.color || null,
      imageUrl: form.imageUrl.trim() || null,
    });
    toast.success("Sujet créé");
    navigate(`/topics/${created.id}/manage`);
  });

  const pending = createTopic.isPending || isSubmitting;
  const categoryItems = (categories.data ?? []).map((item) => ({
    value: item.category,
    label: item.label,
  }));

  return (
    <PageContainer className="max-w-[880px]">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 mb-3"
        nativeButton={false} render={<Link to="/topics/mine" />}
      >
        <ArrowLeft /> Mes sujets
      </Button>

      <div className="mb-5">
        <h1 className="font-heading text-xl font-bold">Créer un sujet</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Le sujet reste en brouillon jusqu'à la publication (7 questions approuvées minimum).
        </p>
      </div>

      <form onSubmit={onSubmit}>
        <FormSection
          title="Le sujet"
          sub="Nom, description et catégorie — modifiables après création."
        >
          <FormRow
            label="Aperçu"
            description="Rendu de la carte : illustration, emoji ou icône de catégorie."
            controlClassName="flex tablet-up:justify-end"
          >
            <TopicIcon
              topic={{
                emoji: emoji.trim() || null,
                color: color || null,
                imageUrl: imageUrl.trim() || null,
                category: category || null,
              }}
              size={56}
              className="rounded-[18px] shadow-lg"
            />
          </FormRow>

          <FormRow
            label="Nom"
            description="25 caractères max — affiché dans le catalogue."
            htmlFor="name"
          >
            <Input id="name" maxLength={25} autoFocus {...register("name")} />
            {errors.name ? (
              <p className="mt-1.5 text-xs text-destructive">{errors.name.message}</p>
            ) : (
              <p className="mt-1.5 text-right text-xs text-muted-foreground">
                {name.length}/25
              </p>
            )}
          </FormRow>

          <FormRow
            stacked
            label="Description"
            description="500 caractères max — présentée sur la fiche du sujet."
            htmlFor="description"
          >
            <Textarea
              id="description"
              rows={3}
              maxLength={500}
              placeholder="Quelques mots sur le sujet…"
              {...register("description")}
            />
            {errors.description ? (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.description.message}
              </p>
            ) : (
              <p className="mt-1.5 text-right text-xs text-muted-foreground">
                {description.length}/500
              </p>
            )}
          </FormRow>

          <FormRow
            label="Catégorie"
            description="Détermine l'icône de repli et la couleur automatique."
          >
            <Select
              items={categoryItems}
              value={category}
              onValueChange={(value) =>
                setValue("category", value ?? "", { shouldValidate: true })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {(categories.data ?? []).map((item) => (
                  <SelectItem key={item.category} value={item.category}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.category.message}
              </p>
            )}
          </FormRow>

          <FormRow
            label="Emoji"
            description="Optionnel — affiché si le sujet n'a pas d'illustration."
          >
            <EmojiPickerField
              theme={theme}
              value={emoji.trim() || null}
              onChange={(value) =>
                setValue("emoji", value ?? "", { shouldValidate: true })
              }
            />
            {errors.emoji && (
              <p className="mt-1.5 text-xs text-destructive">{errors.emoji.message}</p>
            )}
          </FormRow>
        </FormSection>

        <FormSection
          title="Apparence"
          sub="Couleur d'accent et illustration de couverture — optionnelles."
        >
          <FormRow
            label="Couleur d'accent"
            description="Teinte des cartes et de l'arène ; « Auto » reprend la couleur de la catégorie."
            controlClassName="flex items-center gap-2"
          >
            <input
              type="color"
              aria-label="Couleur d'accent"
              className="h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
              value={color || categoryColor(category)}
              onChange={(event) =>
                setValue("color", event.target.value, { shouldValidate: true })
              }
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setValue("color", "", { shouldValidate: true })}
            >
              Auto
            </Button>
          </FormRow>

          <FormRow
            label="Illustration"
            description="URL http(s) d'une image de couverture (Wikimedia, etc.)."
            htmlFor="imageUrl"
          >
            <Input id="imageUrl" placeholder="https://…" {...register("imageUrl")} />
            {errors.imageUrl && (
              <p className="mt-1.5 text-xs text-destructive">
                {errors.imageUrl.message}
              </p>
            )}
          </FormRow>
        </FormSection>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/topics/mine")}
            disabled={pending}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Création…" : "Créer le brouillon"}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
