/** Type de suggestion de la palette ⌘K (enum backend `SuggestionView.Type`). */
export type SuggestionType = "TOPIC" | "PLAYER";

/** Suggestion de la palette ⌘K (`SuggestionView`). */
export interface Suggestion {
  type: SuggestionType;
  id: string;
  label: string | null;
  subtitle: string | null;
  emoji: string | null;
  color: string | null;
  imageUrl: string | null;
  avatarOptions: string | null;
}
