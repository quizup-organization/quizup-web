import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NotificationEnvelope } from "@/shared/types/notifications";
import { NotificationStream } from "./notification-stream";

const wsMock = vi.hoisted(() => ({
  handler: undefined as ((message: { body: string }) => void) | undefined,
  onConnect: undefined as (() => void) | undefined,
}));

vi.mock("@/lib/ws", () => ({
  subscribeStomp: (
    _service: string,
    _destination: string,
    handler: (message: { body: string }) => void,
    onConnect?: () => void,
  ) => {
    wsMock.handler = handler;
    wsMock.onConnect = onConnect;
    return () => {};
  },
}));

interface Payload {
  type: string;
}

interface State {
  applied: string[];
}

function envelope<T>(sequenceNumber: number, payload: T): NotificationEnvelope<T> {
  return {
    notificationId: `n-${sequenceNumber}`,
    aggregateId: "g1",
    sequenceNumber,
    occurredAt: "2026-09-18T10:00:00Z",
    payload,
  };
}

function buildStream(
  load: () => Promise<NotificationEnvelope<Payload>[]>,
  apply: (state: State, payload: Payload) => State = (state, payload) => ({
    applied: [...state.applied, payload.type],
  }),
) {
  return new NotificationStream<Payload, State>({
    service: "game",
    aggregateId: "g1",
    topic: "/topic/games/g1",
    initial: () => ({ applied: [] }),
    load,
    apply,
  });
}

describe("NotificationStream", () => {
  beforeEach(() => {
    wsMock.handler = undefined;
    wsMock.onConnect = undefined;
  });

  it("charge l'historique REST puis l'applique dans l'ordre", async () => {
    const stream = buildStream(async () => [
      envelope(1, { type: "A" }),
      envelope(2, { type: "B" }),
    ]);

    stream.start();

    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true));
    expect(stream.getSnapshot()).toEqual({ applied: ["A", "B"] });
  });

  it("déduplique par sequenceNumber (REST + WS)", async () => {
    const stream = buildStream(async () => [
      envelope(1, { type: "A" }),
      envelope(2, { type: "B" }),
    ]);
    stream.start();
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true));

    // Rejoue la séquence 2 (déjà appliquée) puis une nouvelle séquence 3.
    wsMock.handler?.({ body: JSON.stringify(envelope(2, { type: "B" })) });
    expect(stream.getSnapshot()).toEqual({ applied: ["A", "B"] });

    wsMock.handler?.({ body: JSON.stringify(envelope(3, { type: "C" })) });
    expect(stream.getSnapshot()).toEqual({ applied: ["A", "B", "C"] });
  });

  it("ignore les enveloppes malformées (JSON invalide, contrat incomplet)", async () => {
    const stream = buildStream(async () => [envelope(1, { type: "A" })]);
    stream.start();
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true));

    wsMock.handler?.({ body: "{not-json" });
    wsMock.handler?.({ body: JSON.stringify({ foo: "bar" }) });
    wsMock.handler?.({ body: JSON.stringify({ ...envelope(2, { type: "B" }), payload: null }) });

    expect(stream.getSnapshot()).toEqual({ applied: ["A"] });
  });

  it("ne corrompt jamais l'état si le fold renvoie undefined (type inconnu)", async () => {
    const stream = buildStream(
      async () => [envelope(1, { type: "A" })],
      () => undefined as unknown as State,
    );
    stream.start();
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true));

    wsMock.handler?.({ body: JSON.stringify(envelope(2, { type: "UNKNOWN" })) });

    expect(stream.getSnapshot()).toEqual({ applied: [] });
  });

  it("rejoue l'historique à la (re)connexion WS", async () => {
    let calls = 0;
    const stream = buildStream(async () => {
      calls += 1;
      return [envelope(1, { type: calls === 1 ? "A" : "A2" })];
    });
    stream.start();
    await vi.waitFor(() => expect(stream.isLoaded()).toBe(true));
    expect(stream.getSnapshot()).toEqual({ applied: ["A"] });

    wsMock.onConnect?.();

    await vi.waitFor(() =>
      expect(stream.getSnapshot()).toEqual({ applied: ["A2"] }),
    );
  });
});
