import { describe, expect, it } from "vitest"
import { isFinishedOutcome } from "./history"

describe("isFinishedOutcome", () => {
  it("reconnaît les parties au bilan définitif", () => {
    expect(isFinishedOutcome("WIN")).toBe(true)
    expect(isFinishedOutcome("LOSS")).toBe(true)
    expect(isFinishedOutcome("DRAW")).toBe(true)
  })

  it("exclut les parties sans bilan sportif", () => {
    expect(isFinishedOutcome("WAITING")).toBe(false)
    expect(isFinishedOutcome("IN_PROGRESS")).toBe(false)
    expect(isFinishedOutcome("CANCELLED")).toBe(false)
  })
})
