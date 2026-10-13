import { beforeEach, describe, expect, it } from "vitest";
import {
  beginIntent,
  endIntent,
  isCurrentIntent,
  resetLatestIntents,
} from "./latest-intent";

describe("latest-intent", () => {
  beforeEach(resetLatestIntents);

  it("seule la dernière génération est courante", () => {
    const first = beginIntent("follow:u2");
    const second = beginIntent("follow:u2");

    expect(isCurrentIntent("follow:u2", first)).toBe(false);
    expect(isCurrentIntent("follow:u2", second)).toBe(true);
  });

  it("les clés sont indépendantes", () => {
    const follow = beginIntent("follow:u2");
    const profile = beginIntent("profile:u1");

    expect(isCurrentIntent("follow:u2", follow)).toBe(true);
    expect(isCurrentIntent("profile:u1", profile)).toBe(true);
    expect(isCurrentIntent("profile:u1", follow)).toBe(false);
  });

  it("endIntent ne libère que la génération courante", () => {
    const first = beginIntent("follow:u2");
    const second = beginIntent("follow:u2");

    endIntent("follow:u2", first);
    expect(isCurrentIntent("follow:u2", second)).toBe(true);

    endIntent("follow:u2", second);
    expect(isCurrentIntent("follow:u2", second)).toBe(false);
  });

  it("ne réattribue jamais une génération libérée (pas de faux courant)", () => {
    const first = beginIntent("follow:u2");
    endIntent("follow:u2", first);
    const second = beginIntent("follow:u2");

    expect(isCurrentIntent("follow:u2", first)).toBe(false);
    expect(isCurrentIntent("follow:u2", second)).toBe(true);
  });
});
