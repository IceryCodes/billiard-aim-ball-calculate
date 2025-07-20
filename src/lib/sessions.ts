export interface Session {
  id: string;
  createdAt: number;
  expiresAt: number;
  ip: string;
  userAgent?: string;
  fileCount: number;
  used: boolean;
  result?: { text: string; confidence: number };
}

const sessions = new Map<string, Session>();
let totalSessionsCreated = 0;

export const getSessions = (): Map<string, Session> => sessions;
export const getSession = (id: string): Session | undefined => sessions.get(id);

export const setSession = (id: string, session: Session): void => {
  sessions.set(id, session);
  totalSessionsCreated++;
};

export const deleteSession = (id: string): void => {
  sessions.delete(id);
};

export const markSessionAsUsed = (id: string): boolean => {
  const session = sessions.get(id);
  if (session && !session.used) {
    session.used = true;
    return true;
  }
  return false;
};

export const incrementFileCount = (id: string): boolean => {
  const session = sessions.get(id);
  if (session) {
    session.fileCount++;
    return true;
  }
  return false;
};

// Vercel 優化的清理函數 - 每次調用都清理，適合 Serverless
export const cleanup = (): number => {
  const now = Date.now();
  let cleanedCount = 0;

  for (const [id, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(id);
      cleanedCount++;
    }
  }

  return cleanedCount;
};

export const getSystemStats = () => {
  const now = Date.now();
  const activeSessions = Array.from(sessions.values()).filter((s) => now <= s.expiresAt);
  const memoryUsage = process.memoryUsage();

  return {
    totalSessions: sessions.size,
    activeSessions: activeSessions.length,
    totalCreated: totalSessionsCreated, // 使用這個變數
    memoryUsage: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    uptime: Math.round(process.uptime()),
  };
};

export const checkIPLimits = (ip: string, maxConcurrent = 5): boolean => {
  const now = Date.now();
  const ipSessions = Array.from(sessions.values()).filter((session) => session.ip === ip && now <= session.expiresAt);
  return ipSessions.length < maxConcurrent;
};
