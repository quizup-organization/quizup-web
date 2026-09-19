import { Client, type IMessage } from "@stomp/stompjs";
import { getAccessToken } from "./auth";
import { config } from "./config";

/**
 * Base WebSocket dérivée de l'URL de la gateway (`http(s)://host` → `ws(s)://host`).
 * Les services exposent un endpoint STOMP `/ws` (SockJS) ; on utilise le transport
 * WebSocket brut `/ws/websocket` via la gateway.
 */
function wsBase(): string {
  return config.apiUrl.replace(/^http/, "ws");
}

function connectHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

type MessageHandler = (message: IMessage) => void;

interface BrokerSubscription {
  unsubscribe: () => void;
}

/**
 * Une connexion STOMP mutualisée par service : plusieurs abonnements (et une rétention
 * « à vide » pour la présence) partagent le même client, reconstruit automatiquement à la
 * reconnexion.
 */
interface ServiceConnection {
  client: Client;
  destinations: Map<string, Set<MessageHandler>>;
  onConnectHandlers: Map<string, Set<() => void>>;
  brokerSubscriptions: Map<string, BrokerSubscription>;
  retained: number;
  active: boolean;
}

const connections = new Map<string, ServiceConnection>();

function brokerSubscribe(
  connection: ServiceConnection,
  destination: string,
): void {
  const subscription = connection.client.subscribe(destination, (message) => {
    connection.destinations.get(destination)?.forEach((handler) => handler(message));
  });
  connection.brokerSubscriptions.set(destination, subscription);
}

function ensureConnection(service: string): ServiceConnection {
  const existing = connections.get(service);
  if (existing) {
    return existing;
  }

  const connection: ServiceConnection = {
    client: undefined as unknown as Client,
    destinations: new Map(),
    onConnectHandlers: new Map(),
    brokerSubscriptions: new Map(),
    retained: 0,
    active: false,
  };

  const client = new Client({
    webSocketFactory: () =>
      new WebSocket(`${wsBase()}/${service}-service/ws/websocket`),
    reconnectDelay: 3000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    debug: () => {},
    beforeConnect: () => {
      client.connectHeaders = connectHeaders();
    },
  });

  client.onConnect = () => {
    connection.brokerSubscriptions.forEach((sub) => sub.unsubscribe());
    connection.brokerSubscriptions.clear();
    connection.destinations.forEach((_handlers, destination) =>
      brokerSubscribe(connection, destination),
    );
    connection.onConnectHandlers.forEach((handlers) =>
      handlers.forEach((onConnect) => onConnect()),
    );
  };
  client.onWebSocketClose = () => {
    connection.brokerSubscriptions.clear();
  };

  connection.client = client;
  connections.set(service, connection);
  return connection;
}

function activate(connection: ServiceConnection): void {
  if (!connection.active) {
    connection.active = true;
    connection.client.activate();
  }
}

function deactivateIfIdle(
  service: string,
  connection: ServiceConnection,
): void {
  if (
    connection.destinations.size === 0 &&
    connection.retained === 0 &&
    connection.active
  ) {
    connection.active = false;
    connections.delete(service);
    void connection.client.deactivate();
  }
}

/** Abonne un handler à une destination STOMP (connexion mutualisée par service). */
export function subscribeStomp(
  service: string,
  destination: string,
  handler: MessageHandler,
  onConnect?: () => void,
): () => void {
  const connection = ensureConnection(service);

  let handlers = connection.destinations.get(destination);
  if (!handlers) {
    handlers = new Set();
    connection.destinations.set(destination, handlers);
  }
  handlers.add(handler);

  if (onConnect) {
    let connectHandlers = connection.onConnectHandlers.get(destination);
    if (!connectHandlers) {
      connectHandlers = new Set();
      connection.onConnectHandlers.set(destination, connectHandlers);
    }
    connectHandlers.add(onConnect);
  }

  if (connection.client.connected) {
    if (!connection.brokerSubscriptions.has(destination)) {
      brokerSubscribe(connection, destination);
    }
    onConnect?.();
  } else {
    activate(connection);
  }

  return () => {
    const current = connection.destinations.get(destination);
    if (current) {
      current.delete(handler);
      if (current.size === 0) {
        connection.destinations.delete(destination);
        connection.brokerSubscriptions.get(destination)?.unsubscribe();
        connection.brokerSubscriptions.delete(destination);
      }
    }
    if (onConnect) {
      const connectHandlers = connection.onConnectHandlers.get(destination);
      connectHandlers?.delete(onConnect);
      if (connectHandlers && connectHandlers.size === 0) {
        connection.onConnectHandlers.delete(destination);
      }
    }
    deactivateIfIdle(service, connection);
  };
}

/**
 * Maintient la connexion d'un service active sans abonnement — pour la présence, où le
 * `CONNECT` authentifié est lui-même le signal. Retourne la fonction de libération.
 */
export function retainStompConnection(service: string): () => void {
  const connection = ensureConnection(service);
  connection.retained += 1;
  activate(connection);

  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    connection.retained = Math.max(0, connection.retained - 1);
    deactivateIfIdle(service, connection);
  };
}

export type { IMessage };
