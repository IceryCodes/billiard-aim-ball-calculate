/* eslint-disable no-console */
import { NextApiResponse } from 'next';

interface ClientConnection {
  res: NextApiResponse;
  tabId: string;
  lastPing: number;
}

interface ConnectionStore {
  connections: Map<string, Map<string, ClientConnection>>;
  pendingRemovals: Set<string>;
}

const STALE_THRESHOLD = 30000;
const store: ConnectionStore = {
  connections: new Map(),
  pendingRemovals: new Set(),
};

let cleanupInterval: NodeJS.Timeout;

const initCleanup = () => {
  if (!cleanupInterval) {
    cleanupInterval = setInterval(() => cleanupStaleConnections(), 15000);
  }
};

const addConnection = async (courtId: string, tabId: string, res: NextApiResponse): Promise<void> => {
  const key = `${courtId}-${tabId}`;
  while (store.pendingRemovals.has(key)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (!store.connections.has(courtId)) {
    store.connections.set(courtId, new Map());
  }

  if (store.connections.get(courtId)?.has(tabId)) {
    await removeConnection(courtId, tabId);
  }

  store.connections.get(courtId)?.set(tabId, {
    res,
    tabId,
    lastPing: Date.now(),
  });

  //   console.log(`[ConnectionManager] Added/Updated connection for tab ${tabId}`);
  if (process.env.NODE_ENV === 'development') logConnectionStatus(courtId);
};

const removeConnection = async (courtId: string, tabId: string): Promise<void> => {
  const key = `${courtId}-${tabId}`;
  store.pendingRemovals.add(key);

  try {
    const connections = store.connections.get(courtId);
    if (connections?.has(tabId)) {
      const connection = connections.get(tabId);
      if (connection && !connection.res.writableEnded) {
        try {
          const closeEvent = `event: close\ndata: {"tabId":"${tabId}"}\n\n`;
          connection.res.write(closeEvent);
          await new Promise<void>((resolve) => {
            connection.res.end(() => resolve());
          });
        } catch (error) {
          console.error(`[ConnectionManager] Error closing connection for tab ${tabId}:`, error);
        }
      }
      connections.delete(tabId);
      console.log(`[ConnectionManager] Removed connection for tab ${tabId}`);

      if (connections.size === 0) {
        store.connections.delete(courtId);
        console.log(`[ConnectionManager] Removed court ${courtId} (no more connections)`);
      }
      if (process.env.NODE_ENV === 'development') logConnectionStatus(courtId);
    }
  } finally {
    store.pendingRemovals.delete(key);
  }
};

const sendEvent = (courtId: string, tabId: string, eventName: string, data: unknown): void => {
  const connection = store.connections.get(courtId)?.get(tabId);
  if (connection && !connection.res.writableEnded) {
    try {
      const eventData = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
      connection.res.write(eventData);
      connection.lastPing = Date.now();
    } catch (error) {
      console.error(`[ConnectionManager] Error sending event to tab ${tabId}:`, error);
      removeConnection(courtId, tabId);
    }
  }
};

const broadcastToCourt = (courtId: string, eventName: string, data: unknown): { success: number; failed: number } => {
  const connections = store.connections.get(courtId);
  if (!connections || connections.size === 0) {
    console.log(`[ConnectionManager] No connections for court ${courtId}`);
    return { success: 0, failed: 0 };
  }

  let successCount = 0;
  let failedCount = 0;
  const connectionEntries = Array.from(connections.entries());

  for (const [tabId, connection] of connectionEntries) {
    try {
      if (!connection.res.writableEnded) {
        const eventData = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
        connection.res.write(eventData);
        connection.lastPing = Date.now();
        successCount++;
      } else {
        removeConnection(courtId, tabId);
        failedCount++;
      }
    } catch (error) {
      console.error(`[ConnectionManager] Broadcast error for tab ${tabId}:`, error);
      removeConnection(courtId, tabId);
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
};

const cleanupStaleConnections = async (): Promise<void> => {
  const currentTime = Date.now();
  const tasks: Promise<void>[] = [];

  for (const [courtId, connections] of store.connections.entries()) {
    for (const [tabId, connection] of connections.entries()) {
      if (currentTime - connection.lastPing > STALE_THRESHOLD) {
        tasks.push(removeConnection(courtId, tabId));
      }
    }
  }

  await Promise.all(tasks);
};

const getConnection = (courtId: string, tabId: string): ClientConnection | undefined => {
  return store.connections.get(courtId)?.get(tabId);
};

const getConnectionsInfo = (): { totalConnections: number; connections: Record<string, string[]> } => {
  const info: Record<string, string[]> = {};
  let total = 0;

  store.connections.forEach((courtConnections, courtId) => {
    info[courtId] = Array.from(courtConnections.keys());
    total += courtConnections.size;
  });

  return {
    totalConnections: total,
    connections: info,
  };
};

const logConnectionStatus = (courtId: string): void => {
  const connections = store.connections.get(courtId);
  const connectionCount = connections?.size || 0;
  console.log(`[ConnectionManager] Court ${courtId} has ${connectionCount} connections`);
};

initCleanup();

export { addConnection, broadcastToCourt, getConnection, getConnectionsInfo, removeConnection, sendEvent };
