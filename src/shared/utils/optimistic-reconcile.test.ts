import { describe, expect, it, vi } from "vitest";
import { reconcileUntil } from "./optimistic-reconcile";

interface FollowView {
  following: boolean;
  followersCount: number;
}

describe("reconcileUntil", () => {
  it("converge sur la réponse confirmée sans jamais appliquer de valeur périmée", async () => {
    const stale: FollowView = { following: false, followersCount: 10 };
    const fresh: FollowView = { following: true, followersCount: 11 };
    const read = vi
      .fn<() => Promise<FollowView>>()
      .mockResolvedValueOnce(stale)
      .mockResolvedValueOnce(stale)
      .mockResolvedValueOnce(fresh);
    const onConverged = vi.fn();
    const onTimeout = vi.fn();

    await reconcileUntil<FollowView>({
      read,
      matches: (view) => view.following,
      onConverged,
      onTimeout,
      sleep: () => Promise.resolve(),
    });

    expect(read).toHaveBeenCalledTimes(3);
    expect(onConverged).toHaveBeenCalledTimes(1);
    expect(onConverged).toHaveBeenCalledWith(fresh);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it("invalide en secours au timeout quand la convergence n'est jamais observée", async () => {
    const read = vi
      .fn<() => Promise<FollowView>>()
      .mockResolvedValue({ following: false, followersCount: 10 });
    const onConverged = vi.fn();
    const onTimeout = vi.fn();

    await reconcileUntil<FollowView>({
      read,
      matches: (view) => view.following,
      onConverged,
      onTimeout,
      attempts: 3,
      sleep: () => Promise.resolve(),
    });

    expect(read).toHaveBeenCalledTimes(3);
    expect(onConverged).not.toHaveBeenCalled();
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it("traite une erreur de lecture comme une tentative non convergée", async () => {
    const read = vi
      .fn<() => Promise<FollowView>>()
      .mockRejectedValueOnce(new Error("bus down"))
      .mockResolvedValueOnce({ following: true, followersCount: 11 });
    const onConverged = vi.fn();

    await reconcileUntil<FollowView>({
      read,
      matches: (view) => view.following,
      onConverged,
      onTimeout: vi.fn(),
      sleep: () => Promise.resolve(),
    });

    expect(read).toHaveBeenCalledTimes(2);
    expect(onConverged).toHaveBeenCalledWith({ following: true, followersCount: 11 });
  });
});
