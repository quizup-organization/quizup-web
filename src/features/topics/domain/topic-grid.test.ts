import { describe, expect, it } from "vitest";
import { compactTopicGridClass } from "./topic-grid";

describe("compactTopicGridClass", () => {
  it("produit une grille à 3 colonnes", () => {
    expect(compactTopicGridClass(3)).toContain("grid-cols-3");
    expect(compactTopicGridClass(3)).not.toContain("grid-cols-4");
  });

  it("produit une grille à 4 colonnes", () => {
    expect(compactTopicGridClass(4)).toContain("grid-cols-4");
    expect(compactTopicGridClass(4)).not.toContain("grid-cols-3");
  });
});
