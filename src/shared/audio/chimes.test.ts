import { describe, expect, it } from "vitest"
import {
  ACCUMULATION_TICK_INTERVAL_MS,
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
  accumulationChime,
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

  it("garde les motifs d'issue dans la bande audible des haut-parleurs d'appareils", () => {
    // Un motif sous ~350 Hz est inaudible sur un portable/téléphone : la défaite paraissait
    // muette alors que la victoire (784–1568 Hz) passait (cf. `DEFEAT_CHIME`).
    for (const chime of [VICTORY_CHIME, DEFEAT_CHIME, DRAW_CHIME]) {
      expect(Math.min(...chime.map((note) => note.frequency))).toBeGreaterThan(
        350
      )
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

describe("accumulationChime", () => {
  it("monte d'un demi-ton par tick, à cadence fixe", () => {
    const chime = accumulationChime(6)
    expect(chime).toHaveLength(6)

    const frequencies = chime.map((note) => note.frequency)
    expect(frequencies).toEqual([...frequencies].sort((a, b) => a - b))
    expect(new Set(frequencies).size).toBe(frequencies.length)

    chime.forEach((note, index) => {
      expect(note.offset).toBeCloseTo(
        (index * ACCUMULATION_TICK_INTERVAL_MS) / 1000
      )
      expect(note.frequency).toBeGreaterThan(200)
      expect(note.frequency).toBeLessThan(4000)
      expect(note.gain).toBeLessThanOrEqual(0.3)
      expect(note.duration).toBeGreaterThan(0)
    })
  })

  it("borne le nombre de ticks (au moins deux notes, jamais plus de douze)", () => {
    expect(accumulationChime(0)).toHaveLength(2)
    expect(accumulationChime(-5)).toHaveLength(2)
    expect(accumulationChime(Number.NaN)).toHaveLength(2)
    expect(accumulationChime(3.4)).toHaveLength(3)
    expect(accumulationChime(99)).toHaveLength(12)
  })

  it("garde la salve entière dans la seconde, à la borne haute", () => {
    const chime = accumulationChime(12)
    const end = Math.max(...chime.map((note) => note.offset + note.duration))
    expect(end).toBeLessThanOrEqual(1)
  })
})
