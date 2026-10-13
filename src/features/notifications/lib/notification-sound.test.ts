import { describe, expect, it } from "vitest"
import { NOTIFICATION_CHIME, playNotificationSound } from "./notification-sound"

describe("notificationSound", () => {
  it("décrit un chime court et audible", () => {
    expect(NOTIFICATION_CHIME.length).toBeGreaterThanOrEqual(2)
    for (const note of NOTIFICATION_CHIME) {
      expect(note.frequency).toBeGreaterThan(200)
      expect(note.frequency).toBeLessThan(4000)
      expect(note.duration).toBeGreaterThan(0)
      expect(note.gain).toBeGreaterThan(0)
      expect(note.gain).toBeLessThanOrEqual(0.3)
    }
    const offsets = NOTIFICATION_CHIME.map((note) => note.offset)
    expect([...offsets].sort((a, b) => a - b)).toEqual(offsets)
  })

  it("ne casse pas si l'API Web Audio est indisponible", () => {
    expect(() => playNotificationSound()).not.toThrow()
  })
})
