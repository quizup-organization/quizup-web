import { describe, expect, it } from "vitest"
import { shareMessage } from "./share"

describe("shareMessage", () => {
  it("cite le sujet quand il est connu", () => {
    expect(shareMessage("Cinéma")).toContain("« Cinéma »")
    expect(shareMessage()).not.toContain("«")
  })
})
