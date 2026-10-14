// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ chimeWindowEnd: 0 }))

vi.mock("@/shared/audio", () => ({
  outcomeChimeWindowEndsAt: () => state.chimeWindowEnd,
}))

import { useRewardRevealGate } from "./useRewardRevealGate"

/** Avance l'horloge factice **et** laisse React appliquer l'état du timer. */
function advance(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

describe("useRewardRevealGate", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-06-01T10:00:00Z"))
    state.chimeWindowEnd = 0
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("reste fermé tant que la récompense n'est pas projetée", () => {
    const { result } = renderHook(
      ({ available }: { available: boolean }) => useRewardRevealGate(available),
      { initialProps: { available: false } }
    )
    advance(10_000)

    expect(result.current).toBe(false)
  })

  it("n'ouvre pas avant la fin de l'animation d'ouverture (sons coupés, aucun jingle)", () => {
    const { result, rerender } = renderHook(
      ({ available }: { available: boolean }) => useRewardRevealGate(available),
      { initialProps: { available: false } }
    )

    rerender({ available: true })
    advance(339)
    expect(result.current).toBe(false)

    advance(1)
    expect(result.current).toBe(true)
  })

  it("attend la fin du son du bilan quand il est réservé", () => {
    state.chimeWindowEnd = Date.now() + 980

    const { result } = renderHook(() => useRewardRevealGate(true))
    advance(979)
    expect(result.current).toBe(false)

    advance(1)
    expect(result.current).toBe(true)
  })

  it("ouvre tout de suite quand l'ouverture et le son sont déjà passés (récompense tardive)", () => {
    // Récompense projetée 5 s après le montage : le jingle est terminé depuis longtemps.
    const { result, rerender } = renderHook(
      ({ available }: { available: boolean }) => useRewardRevealGate(available),
      { initialProps: { available: false } }
    )
    advance(5_000)
    rerender({ available: true })
    advance(1)

    expect(result.current).toBe(true)
  })
})
