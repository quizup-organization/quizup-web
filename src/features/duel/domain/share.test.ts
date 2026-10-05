import { describe, expect, it } from "vitest";
import {
  questionShareMessage,
  resultShareMessage,
  shareMessage,
} from "./share";

describe("shareMessage", () => {
  it("cite le sujet quand il est connu", () => {
    expect(shareMessage("Cinéma")).toContain("« Cinéma »");
    expect(shareMessage()).not.toContain("«");
  });
});

describe("resultShareMessage", () => {
  it("annonce la victoire avec le score et le sujet", () => {
    expect(resultShareMessage("win", 114, 87, "Cinéma")).toBe(
      "J'ai gagné 114 à 87 sur Cinéma — tente de me battre !",
    );
  });

  it("annonce la défaite et le match nul", () => {
    expect(resultShareMessage("loss", 87, 114)).toContain("J'ai perdu 87 à 114");
    expect(resultShareMessage("draw", 90, 90)).toContain("Match nul 90 à 90");
  });
});

describe("questionShareMessage", () => {
  it("reprend la question et cite le sujet", () => {
    expect(questionShareMessage("Qui a peint la Joconde ?", "Art")).toBe(
      "Qui a peint la Joconde ? — viens jouer à « Art » sur QuizUp !",
    );
    expect(questionShareMessage("Question ?")).not.toContain("«");
  });
});
