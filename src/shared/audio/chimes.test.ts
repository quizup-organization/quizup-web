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
  countdownTickChime,
  notificationChime,
  waitTickChime,
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

  it("alterne tic et tac chaque seconde et monte sur les dernières secondes", () => {
    const tic = countdownTickChime(5)
    const tac = countdownTickChime(4)

    // Hors fenêtre de tension : ni l'un ni l'autre ne monte.
    expect(tic[0].frequency).toBeCloseTo(1174.66)
    expect(tac[0].frequency).toBeCloseTo(880)

    // Dernières secondes : +1 demi-ton par seconde (3 → 1), cadence inchangée.
    expect(countdownTickChime(3)[0].frequency).toBeCloseTo(
      1174.66 * 2 ** (1 / 12)
    )
    expect(countdownTickChime(2)[0].frequency).toBeCloseTo(880 * 2 ** (2 / 12))
    expect(countdownTickChime(1)[0].frequency).toBeCloseTo(
      1174.66 * 2 ** (3 / 12)
    )
    expect(countdownTickChime(0)[0].frequency).toBeCloseTo(880 * 2 ** (4 / 12))
  })

  it("donne un tic d'attente neutre, alterné, sans tension (salon)", () => {
    // Deux pas consécutifs alternent tic/tac, sans montée (aucune échéance à annoncer).
    expect(waitTickChime(0)[0].frequency).toBeCloseTo(880)
    expect(waitTickChime(1)[0].frequency).toBeCloseTo(1174.66)
    expect(waitTickChime(2)[0].frequency).toBeCloseTo(880)
    // Même hauteur qu'un tic de countdown hors fenêtre de tension (identité sonore partagée).
    expect(waitTickChime(1)[0].frequency).toBeCloseTo(
      countdownTickChime(5)[0].frequency
    )
  })

  it("décrit un tic court et discret (deux notes, harmonique à l'octave)", () => {
    for (const secondsLeft of [0, 1, 4, 10]) {
      const tick = countdownTickChime(secondsLeft)
      expect(tick).toHaveLength(2)
      expect(tick[1].frequency).toBeCloseTo(tick[0].frequency * 2)
      expect(tick[1].gain).toBeLessThan(tick[0].gain)
      expect(tick[0].gain).toBeLessThanOrEqual(0.1)
      expect(tick[0].frequency).toBeGreaterThan(200)
      expect(tick[1].frequency).toBeLessThan(4000)
      const total = Math.max(...tick.map((n) => n.offset + n.duration))
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

  it("borne le nombre de ticks (au moins deux notes, jamais plus de vingt-quatre)", () => {
    expect(accumulationChime(0)).toHaveLength(2)
    expect(accumulationChime(-5)).toHaveLength(2)
    expect(accumulationChime(Number.NaN)).toHaveLength(2)
    expect(accumulationChime(3.4)).toHaveLength(3)
    expect(accumulationChime(99)).toHaveLength(24)
  })

  it("étale la salve maximale sur ~1,7 s (elle épouse l'animation d'accumulation)", () => {
    const chime = accumulationChime(24)
    const end = Math.max(...chime.map((note) => note.offset + note.duration))
    // 23 intervalles + la dernière note : couvre l'anneau de résultat (1,6 s), pas plus.
    expect(end).toBeGreaterThan(1.6)
    expect(end).toBeLessThanOrEqual(1.8)
  })
})
