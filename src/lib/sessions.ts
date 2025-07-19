export interface Session {
  id: string;
  createdAt: number;
  expiresAt: number;
  result?: {
    text: string;
    confidence: number;
  };
}

// 使用模塊級別的 Map 來管理 sessions
const sessions = new Map<string, Session>();

export const getSessions = (): Map<string, Session> => {
  return sessions;
};

export const getSession = (id: string): Session | undefined => {
  return sessions.get(id);
};

export const setSession = (id: string, session: Session): void => {
  sessions.set(id, session);
};

export const deleteSession = (id: string): void => {
  sessions.delete(id);
};

export const cleanup = (): void => {
  const now = Date.now();
  for (const [id, session] of sessions.entries()) {
    if (now > session.expiresAt) {
      sessions.delete(id);
    }
  }
};
