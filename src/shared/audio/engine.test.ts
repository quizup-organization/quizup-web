import { describe, expect, it } from "vitest"
import { NOTIFICATION_CHIME } from "./chimes"
import { playChime } from "./engine"

describe("playChime", () => {
  it("ne casse pas si l'API Web Audio est indisponible", () => {
    expect(() => playChime(NOTIFICATION_CHIME)).not.toThrow()
  })
})
