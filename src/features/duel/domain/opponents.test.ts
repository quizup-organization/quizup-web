import { describe, expect, it } from "vitest";
import type { Suggestion } from "@/features/shell/domain/suggestion";
import { playerSuggestions } from "./opponents";

const topic: Suggestion = {
  type: "TOPIC",
  id: "topic-1",
  label: "Star Wars",
  subtitle: "Cinéma",
  emoji: "🚀",
  color: null,
  imageUrl: null,
  avatarOptions: null,
};

const player = (id: string, label: string | null = "Joueur"): Suggestion => ({
  type: "PLAYER",
  id,
  label,
  subtitle: "Niveau 3",
  emoji: null,
  color: null,
  imageUrl: null,
  avatarOptions: null,
});

describe("playerSuggestions", () => {
  it("garde les joueurs, écarte les sujets et soi-même", () => {
    const result = playerSuggestions(
      [topic, player("me"), player("opponent-1")],
      "me",
    );

    expect(result.map((s) => s.id)).toEqual(["opponent-1"]);
  });

  it("écarte les joueurs sans libellé", () => {
    const result = playerSuggestions([player("opponent-1", null)], "me");

    expect(result).toEqual([]);
  });
});
