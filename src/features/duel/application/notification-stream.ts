import { subscribeStomp } from "@/lib/ws";
import type { NotificationEnvelope } from "@/shared/types/notifications";

interface NotificationStreamOptions<T, S> {
  service: string;
  aggregateId: string;
  topic: string;
  initial: (aggregateId: string) => S;
  load: (aggregateId: string) => Promise<NotificationEnvelope<T>[]>;
  apply: (state: S, payload: T) => S;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Valide le contrat d'enveloppe avant tout fold (ignore les trames malformées). */
function isEnvelope(value: unknown): value is NotificationEnvelope<unknown> {
  if (!isRecord(value)) return false;
  const payload = value.payload;
  return (
    typeof value.notificationId === "string" &&
    typeof value.sequenceNumber === "number" &&
    isRecord(payload) &&
    typeof payload.type === "string"
  );
}

/**
 * Flux de notifications idempotent : bootstrap par l'historique REST, puis entretien par
 * abonnement STOMP. La déduplication s'appuie sur `sequenceNumber` (REST + WS partagent le même
 * enveloppe). À chaque (re)connexion WS, l'historique est rejoué pour fermer la fenêtre
 * REST ↔ WS.
 *
 * <p>Robustesse : les enveloppes malformées sont ignorées et un fold qui renverrait `undefined`
 * (cas défensif) ne corrompt jamais l'état.</p>
 */
export class NotificationStream<T, S> {
  private readonly options: NotificationStreamOptions<T, S>;
  private state: S;
  private lastSequence = -1;
  private loaded = false;
  private hasError = false;
  private loading = false;
  private started = false;
  private pending: NotificationEnvelope<T>[] = [];
  private unsubscribe?: () => void;
  private readonly listeners = new Set<() => void>();

  constructor(options: NotificationStreamOptions<T, S>) {
    this.options = options;
    this.state = options.initial(options.aggregateId);
  }

  getSnapshot = (): S => this.state;

  isLoaded = (): boolean => this.loaded;

  hasLoadError = (): boolean => this.hasError;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  start(): void {
    if (this.started) return;
    this.started = true;
    // Abonnement AVANT le fetch : les notifications WS reçues pendant le chargement de
    // l'historique sont bufferisées puis fusionnées (dédup par séquence).
    this.unsubscribe = subscribeStomp(
      this.options.service,
      this.options.topic,
      (message) => this.onMessage(message.body),
      () => void this.reload(),
    );
    void this.reload();
  }

  stop(): void {
    this.started = false;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  private async reload(): Promise<void> {
    if (this.loading) return;
    this.loading = true;
    this.pending = [];
    try {
      const loaded = await this.options.load(this.options.aggregateId);
      const envelopes = Array.isArray(loaded) ? loaded : [];
      this.reset();
      for (const envelope of envelopes) {
        if (isEnvelope(envelope)) {
          this.applyEnvelope(envelope as NotificationEnvelope<T>);
        }
      }
      // Fusionne les notifications WS arrivées pendant le chargement (ordre + dédup).
      for (const envelope of this.pending) {
        if (envelope.sequenceNumber > this.lastSequence) {
          this.applyEnvelope(envelope);
        }
      }
      this.pending = [];
      this.loaded = true;
      this.hasError = false;
      this.emit();
    } catch {
      this.pending = [];
      this.hasError = true;
      this.emit();
    } finally {
      this.loading = false;
    }
  }

  private reset(): void {
    this.state = this.options.initial(this.options.aggregateId);
    this.lastSequence = -1;
  }

  private onMessage(body: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      return;
    }
    if (!isEnvelope(parsed)) {
      return;
    }
    const envelope = parsed as NotificationEnvelope<T>;
    if (this.loading) {
      this.pending.push(envelope);
      return;
    }
    if (envelope.sequenceNumber <= this.lastSequence) {
      return;
    }
    this.applyEnvelope(envelope);
    this.emit();
  }

  private applyEnvelope(envelope: NotificationEnvelope<T>): void {
    const next = this.options.apply(this.state, envelope.payload);
    // Garde défensive : ne jamais corrompre l'état avec `undefined`.
    if (next !== undefined) {
      this.state = next;
    }
    this.lastSequence = Math.max(this.lastSequence, envelope.sequenceNumber);
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}
