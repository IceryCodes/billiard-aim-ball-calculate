import { SECURITY_LIMITS } from './security-config';

interface MemoryStats {
  totalActiveSessions: number;
  activeIPs: number;
  dailyRequests: number;
}

interface MemoryMonitorInstance {
  incrementSessionCount: (ip: string) => boolean;
  decrementSessionCount: (ip: string) => void;
  checkDailyLimit: (ip: string) => boolean;
  getStats: () => MemoryStats;
  autoCleanup: () => void;
}

// 函數式實現（完全避免類型引用問題）
export const createMemoryMonitor = (): MemoryMonitorInstance => {
  const ipSessionCount = new Map<string, number>();
  const ipDailyCount = new Map<string, { count: number; date: string }>();
  let lastCleanup = Date.now();

  const autoCleanup = (): void => {
    const now = Date.now();
    if (now - lastCleanup > 5 * 60 * 1000) {
      const today = new Date().toDateString();

      for (const [ip, record] of ipDailyCount.entries()) {
        if (record.date !== today) {
          ipDailyCount.delete(ip);
        }
      }

      lastCleanup = now;
    }
  };

  const incrementSessionCount = (ip: string): boolean => {
    autoCleanup();
    const current = ipSessionCount.get(ip) || 0;
    if (current >= SECURITY_LIMITS.MAX_CONCURRENT_SESSIONS) {
      return false;
    }
    ipSessionCount.set(ip, current + 1);
    return true;
  };

  const decrementSessionCount = (ip: string): void => {
    const current = ipSessionCount.get(ip) || 0;
    if (current > 0) {
      ipSessionCount.set(ip, current - 1);
    }
  };

  const checkDailyLimit = (ip: string): boolean => {
    const today = new Date().toDateString();
    const record = ipDailyCount.get(ip);

    if (!record || record.date !== today) {
      ipDailyCount.set(ip, { count: 1, date: today });
      return true;
    }

    if (record.count >= SECURITY_LIMITS.MAX_DAILY_SESSIONS_PER_IP) {
      return false;
    }

    record.count++;
    return true;
  };

  const getStats = (): MemoryStats => ({
    totalActiveSessions: Array.from(ipSessionCount.values()).reduce((a, b) => a + b, 0),
    activeIPs: ipSessionCount.size,
    dailyRequests: ipDailyCount.size,
  });

  return {
    incrementSessionCount,
    decrementSessionCount,
    checkDailyLimit,
    getStats,
    autoCleanup,
  };
};

// 全局實例（函數式版本）
let memoryMonitorInstance: MemoryMonitorInstance | null = null;

export const getMemoryMonitor = (): MemoryMonitorInstance => {
  if (!memoryMonitorInstance) {
    memoryMonitorInstance = createMemoryMonitor();
  }
  return memoryMonitorInstance;
};
