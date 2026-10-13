import { describe, expect, it } from "vitest"
import {
  CORRECT_CHIME,
  DEFEAT_CHIME,
  DRAW_CHIME,
  NOTIFICATION_ACCEPTED_CHIME,
  NOTIFICATION_CHIME,
  NOTIFICATION_DECLINED_CHIME,
  OPPONENT_CHIME,
  SUCCESS_CHIME,
  TIMEOUT_CHIME,
  VICTORY_CHIME,
  WRONG_CHIME,
  notificationChime,
} from "./chimes"

const CHIMES = {
  NOTIFICATION_CHIME,
  NOTIFICATION_ACCEPTED_CHIME,
  NOTIFICATION_DECLINED_CHIME,
  CORRECT_CHIME,
  WRONG_CHIME,
  TIMEOUT_CHIME,
  VICTORY_CHIME,
  DEFEAT_CHIME,
  DRAW_CHIME,
  OPPONENT_CHIME,
  SUCCESS_CHIME,
}

describe("chimes", () => {
  it("décrit des motifs courts et audibles", () => {
    for (const chime of Object.values(CHIMES)) {
      expect(chime.length).toBeGreaterThanOrEqual(2)
      for (const note of chime) {
        expect(note.frequency).toBeGreaterThan(200)
        expect(note.frequency).toBeLessThan(4000)
        expect(note.duration).toBeGreaterThan(0)
        expect(note.gain).toBeGreaterThan(0)
        expect(note.gain).toBeLessThanOrEqual(0.3)
      }
      const offsets = chime.map((note) => note.offset)
      expect([...offsets].sort((a, b) => a - b)).toEqual(offsets)
      const total = Math.max(...chime.map((n) => n.offset + n.duration))
      expect(total).toBeLessThanOrEqual(1)
    }
  })

  it("associe un motif au type de notification (générique par défaut)", () => {
    expect(notificationChime("ROOM_ACCEPTED")).toBe(NOTIFICATION_ACCEPTED_CHIME)
    expect(notificationChime("CHALLENGE_DECLINED")).toBe(
      NOTIFICATION_DECLINED_CHIME
    )
    expect(notificationChime("CHALLENGE_RECEIVED")).toBe(NOTIFICATION_CHIME)
    expect(notificationChime("FOLLOW")).toBe(NOTIFICATION_CHIME)
    expect(notificationChime(null)).toBe(NOTIFICATION_CHIME)
    expect(notificationChime(undefined)).toBe(NOTIFICATION_CHIME)
  })
})
