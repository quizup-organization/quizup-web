import { QueryClient } from "@tanstack/react-query"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  PROJECTION_RECONCILE_DELAY_MS,
  reconcileUntil,
  removeMatchingFromList,
  scheduleInvalidate,
} from "./optimistic-reconcile"

interface View {
  state: "pending" | "ready" | "gone"
  value?: string
}

const ready = (value: string): View => ({ state: "ready", value })

describe("reconcileUntil", () => {
  it("converge dès que la lecture reflète l'intention (et applique onConverged)", async () => {
    const onConverged = vi.fn()
    const reads = [ready("stale"), ready("expected")]
    let index = 0

    const result = await reconcileUntil<View>({
      read: async () => reads[Math.min(index++, reads.length - 1)],
      matches: (view) => view.value === "expected",
      onConverged,
      intervalMs: 0,
    })

    expect(result?.value).toBe("expected")
    expect(index).toBe(2)
    expect(onConverged).toHaveBeenCalledWith(ready("expected"))
  })

  it("abandonne sans attendre sur état terminal (abort), sans onTimeout", async () => {
    const onTimeout = vi.fn()
    let reads = 0

    const result = await reconcileUntil<View>({
      read: async () => {
        reads += 1
        return { state: "gone" as const }
      },
      matches: (view) => view.state === "ready",
      abort: (view) => view.state === "gone",
      onTimeout,
      intervalMs: 0,
    })

    expect(result).toBeNull()
    expect(reads).toBe(1)
    expect(onTimeout).not.toHaveBeenCalled()
  })

  it("retente après une lecture en échec (null) et rappelle onTimeout à l'épuisement", async () => {
    const onTimeout = vi.fn()
    let reads = 0

    const result = await reconcileUntil<View>({
      read: async () => {
        reads += 1
        return null
      },
      matches: () => true,
      onTimeout,
      attempts: 3,
      intervalMs: 0,
    })

    expect(result).toBeNull()
    expect(reads).toBe(3)
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it("n'écrit jamais une lecture périmée : onConverged n'est appelé qu'à la convergence", async () => {
    const onConverged = vi.fn()
    const onTimeout = vi.fn()

    await reconcileUntil<View>({
      read: async () => ready("stale"),
      matches: (view) => view.value === "expected",
      onConverged,
      onTimeout,
      attempts: 2,
      intervalMs: 0,
    })

    expect(onConverged).not.toHaveBeenCalled()
    expect(onTimeout).toHaveBeenCalledTimes(1)
  })
})

describe("scheduleInvalidate", () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
  })

  it("invalide toutes les clés après le délai", async () => {
    const invalidate = vi
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue(undefined)

    scheduleInvalidate(queryClient, [["a"], ["b", "c"]], 0)
    expect(invalidate).not.toHaveBeenCalled()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(invalidate).toHaveBeenCalledTimes(2)
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["a"] })
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ["b", "c"] })
  })

  it("attend la fenêtre de projection Axon par défaut", () => {
    expect(PROJECTION_RECONCILE_DELAY_MS).toBeGreaterThanOrEqual(2_000)
  })
})

describe("removeMatchingFromList", () => {
  it("retire les éléments correspondants et laisse le reste intact", () => {
    const queryClient = new QueryClient()
    queryClient.setQueryData(
      ["items"],
      [
        { id: "a", keep: true },
        { id: "b", keep: false },
      ]
    )

    removeMatchingFromList<{ id: string; keep: boolean }>(
      queryClient,
      ["items"],
      (item) => !item.keep
    )

    expect(queryClient.getQueryData(["items"])).toEqual([
      { id: "a", keep: true },
    ])
  })
})
