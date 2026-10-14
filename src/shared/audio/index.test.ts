import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  CORRECT_CHIME,
  DEFEAT_CHIME,
  DRAW_CHIME,
  NOTIFICATION_ACCEPTED_CHIME,
  NOTIFICATION_CHIME,
  OPPONENT_CHIME,
  TIMEOUT_CHIME,
  VICTORY_CHIME,
  chimeDurationMs,
  resultChime,
} from "./chimes"

vi.mock("./engine", () => ({ playChime: vi.fn() }))

import { playChime } from "./engine"
import {
  outcomeChimeWindowEndsAt,
  playCorrectChime,
  playNotificationChime,
  playOpponentChime,
  playResultChime,
  playSuccessChime,
  playTimeoutChime,
  reserveOutcomeChime,
} from "."

const playChimeMock = vi.mocked(playChime)

describe("sons de l'app", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("route chaque son vers son motif", () => {
    playNotificationChime("CHALLENGE_RECEIVED")
    expect(playChimeMock).toHaveBeenLastCalledWith(NOTIFICATION_CHIME)

    playNotificationChime("ROOM_ACCEPTED")
    expect(playChimeMock).toHaveBeenLastCalledWith(NOTIFICATION_ACCEPTED_CHIME)

    playCorrectChime()
    expect(playChimeMock).toHaveBeenLastCalledWith(CORRECT_CHIME)

    playTimeoutChime()
    expect(playChimeMock).toHaveBeenLastCalledWith(TIMEOUT_CHIME)

    playOpponentChime()
    expect(playChimeMock).toHaveBeenLastCalledWith(OPPONENT_CHIME)

    playResultChime("win")
    expect(playChimeMock).toHaveBeenLastCalledWith(VICTORY_CHIME)

    playResultChime("loss")
    expect(playChimeMock).toHaveBeenLastCalledWith(DEFEAT_CHIME)

    expect(playChimeMock).toHaveBeenCalledTimes(7)
  })

  it("anti-superpose le son de succès", () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date("2026-06-01T10:00:00Z"))
      playSuccessChime()
      expect(playChimeMock).toHaveBeenCalledTimes(1)

      playSuccessChime()
      expect(playChimeMock).toHaveBeenCalledTimes(1)

      vi.setSystemTime(new Date("2026-06-01T10:00:01Z"))
      playSuccessChime()
      expect(playChimeMock).toHaveBeenCalledTimes(2)
    } finally {
      vi.useRealTimers()
    }
  })

  it("réserve la fenêtre du son d'issue (délai d'ouverture + durée réelle du motif)", () => {
    vi.useFakeTimers()
    try {
      vi.setSystemTime(new Date("2026-06-01T10:00:00Z"))
      const start = Date.now()

      // Défaite : dernière note à 0,24 s + 0,4 s = 0,64 s.
      reserveOutcomeChime("loss", 340)
      expect(outcomeChimeWindowEndsAt()).toBe(start + 340 + 640)

      // Égalité : motif plus court (0,12 s + 0,32 s = 0,44 s).
      reserveOutcomeChime("draw", 0)
      expect(outcomeChimeWindowEndsAt()).toBe(start + 440)
    } finally {
      vi.useRealTimers()
    }
  })

  it("mesure la durée d'un motif sur sa dernière note", () => {
    expect(chimeDurationMs(CORRECT_CHIME)).toBe(340)
    expect(chimeDurationMs(VICTORY_CHIME)).toBe(630)
    expect(resultChime("win")).toBe(VICTORY_CHIME)
    expect(resultChime("loss")).toBe(DEFEAT_CHIME)
    expect(resultChime("draw")).toBe(DRAW_CHIME)
  })
})
