import { subscribeStomp } from "@/lib/ws";
import type { EventEnvelopeResponse } from "@/shared/types/notifications";

interface NotificationStreamOptions<T, S> {
  service: string;
  aggregateId: string;
  topic: string;
  initial: (aggregateId: string) => S;
  load: (aggregateId: string) => Promise<EventEnvelopeResponse<T>[]>;
  apply: (state: S, payload: T) => S;
}

/** Statut observable du stream (chargement, retry transitoire, erreur terminale). */
export interface NotificationStreamStatus {
  loaded: boolean;
  /** Un chargement transitoire a échoué : une nouvelle tentative est planifiée. */
  retrying: boolean;
  /** Erreur définitive (ex. 404) : l'agrégat n'existe pas / plus. */
  terminalError: boolean;
}

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 8_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Valide le contrat d'enveloppe avant tout fold (ignore les trames malformées). */
function isEnvelope(value: unknown): value is EventEnvelopeResponse<unknown> {
  if (!isRecord(value)) return false;
  const payload = value.payload;
  return (
    typeof value.aggregateId === "string" &&
    typeof value.sequenceNumber === "number" &&
    isRecord(payload) &&
    typeof payload.type === "string"
  );
}

/**
 * Une erreur 4xx (hors timeout 408) est définitive : pas de retry, l'agrégat est inaccessible.
 * Les erreurs réseau/timeout/5xx sont transitoires et déclenchent un backoff.
 */
function isTerminalError(error: unknown): boolean {
  const status = (error as { statusCode?: number } | undefined)?.statusCode;
  return status != null && status >= 400 && status < 500 && status !== 408;
}

/**
 * Flux de notifications idempotent : bootstrap par l'historique REST, puis entretien par
 * abonnement STOMP. La déduplication s'appuie sur `sequenceNumber` (REST + WS partagent le même
 * enveloppe). À chaque (re)connexion WS, l'historique est rejoué pour fermer la fenêtre
 * REST ↔ WS.
 *
 * <p>Robustesse : les enveloppes malformées sont ignorées, un fold qui renverrait `undefined`
 * (cas défensif) ne corrompt jamais l'état, et un échec de chargement transitoire est retenté
 * avec backoff tant que le stream est démarré (l'écran affiche « reprise » au lieu d'échouer).</p>
 */
export class NotificationStream<T, S> {
  private readonly options: NotificationStreamOptions<T, S>;
  private state: S;
  private lastSequence = -1;
  private loading = false;
  private started = false;
  private pending: EventEnvelopeResponse<T>[] = [];
  private unsubscribe?: () => void;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private retryAttempt = 0;
  private status: NotificationStreamStatus = {
    loaded: false,
    retrying: false,
    terminalError: false,
  };
  private readonly listeners = new Set<() => void>();

  constructor(options: NotificationStreamOptions<T, S>) {
    this.options = options;
    this.state = options.initial(options.aggregateId);
  }

  getSnapshot = (): S => this.state;

  getStatus = (): NotificationStreamStatus => this.status;

  isLoaded = (): boolean => this.status.loaded;

  hasLoadError = (): boolean => this.status.terminalError;

  isRetrying = (): boolean => this.status.retrying;

  /** Rejoue l'historique REST (filet de rattrapage quand une trame WS est manquée). */
  refresh = (): void => {
    void this.reload();
  };

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
    this.clearRetryTimer();
    this.retryAttempt = 0;
    if (this.status.retrying) {
      this.setStatus({ retrying: false });
    }
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
          this.applyEnvelope(envelope as EventEnvelopeResponse<T>);
        }
      }
      // Fusionne les notifications WS arrivées pendant le chargement (ordre + dédup).
      for (const envelope of this.pending) {
        if (envelope.sequenceNumber > this.lastSequence) {
          this.applyEnvelope(envelope);
        }
      }
      this.pending = [];
      this.retryAttempt = 0;
      this.clearRetryTimer();
      this.setStatus({ loaded: true, retrying: false, terminalError: false });
      this.emit();
    } catch (error) {
      this.pending = [];
      if (isTerminalError(error)) {
        this.retryAttempt = 0;
        this.clearRetryTimer();
        this.setStatus({ retrying: false, terminalError: true });
      } else if (this.started) {
        this.retryAttempt += 1;
        this.setStatus({ retrying: true });
        this.scheduleRetry();
      }
      this.emit();
    } finally {
      this.loading = false;
    }
  }

  private scheduleRetry(): void {
    if (!this.started || this.retryTimer) return;
    const delay = Math.min(
      RETRY_BASE_MS * 2 ** Math.max(0, this.retryAttempt - 1),
      RETRY_MAX_MS,
    );
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined;
      void this.reload();
    }, delay);
  }

  private clearRetryTimer(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }
  }

  private setStatus(patch: Partial<NotificationStreamStatus>): void {
    this.status = { ...this.status, ...patch };
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
    const envelope = parsed as EventEnvelopeResponse<T>;
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

  private applyEnvelope(envelope: EventEnvelopeResponse<T>): void {
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
