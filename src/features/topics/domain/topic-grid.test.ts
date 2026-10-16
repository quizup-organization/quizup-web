import { describe, expect, it } from "vitest"
import { topicGridClass } from "./topic-grid"

describe("topicGridClass", () => {
  it("produit une grille à 3 colonnes en compact, 5/7 ensuite", () => {
    expect(topicGridClass(3)).toContain("grid-cols-3")
    expect(topicGridClass(3)).toContain("tablet:grid-cols-5")
    expect(topicGridClass(3)).toContain("desktop:grid-cols-7")
    expect(topicGridClass(3)).not.toContain("grid-cols-4")
  })

  it("produit une grille à 4 colonnes en compact, 5/7 ensuite", () => {
    expect(topicGridClass(4)).toContain("grid-cols-4")
    expect(topicGridClass(4)).toContain("tablet:grid-cols-5")
    expect(topicGridClass(4)).toContain("desktop:grid-cols-7")
    expect(topicGridClass(4)).not.toContain("grid-cols-3")
  })
})
