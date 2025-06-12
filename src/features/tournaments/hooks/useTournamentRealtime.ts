import { useCallback, useEffect, useRef, useState } from 'react';

import { ConnectionQualityType } from '@/app/courts/[courtCustomLink]/tournaments/[customLink]/edit/components/interfaces';
import { BroadcastUpdateData, PresenceData, RealtimeMessage } from '@/domains/realtime';
import { RealtimeMessageType } from '@/domains/tournament';
import { RealtimeChannel, supabase } from '@/lib/supabase';

type SubscriptionStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED';

interface SupabaseBroadcastPayload {
  payload: RealtimeMessage;
}

interface UseRealtimeProps {
  tournamentId: string;
  userId?: string;
  enabled?: boolean;
  onMessage?: (message: RealtimeMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error | string) => void;
}

interface UseRealtimeReturn {
  isConnected: boolean;
  onlineCount: number;
  sendMessage: (message: Partial<RealtimeMessage>) => boolean;
  broadcastUpdate: (updateData: BroadcastUpdateData) => Promise<boolean>;
  lastMessage: RealtimeMessage | null;
  reconnect: () => void;
  connectionQuality: ConnectionQualityType;
}

interface PresenceState {
  [key: string]: PresenceData[];
}

// 連線配置常數
const HEARTBEAT_INTERVAL = 30000; // 30秒心跳檢測
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // 指數退避延遲
const USER_ACTIVITY_TIMEOUT = 60000; // 1分鐘無活動後降低心跳頻率
const IDLE_HEARTBEAT_INTERVAL = 120000; // 閒置時2分鐘心跳一次
const CONNECTION_QUALITY_THRESHOLD = 3; // 連續失敗次數閾值

export function useTournamentRealtime({
  tournamentId,
  userId = 'anonymous',
  enabled = true,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseRealtimeProps): UseRealtimeReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMounted = useRef(true);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const reconnectAttemptsRef = useRef<number>(0);
  const consecutiveFailuresRef = useRef<number>(0);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const isReconnectingRef = useRef<boolean>(false);

  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQualityType>(ConnectionQualityType.DISCONNECTED);

  const callbacksRef = useRef({
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onConnect,
      onDisconnect,
      onError,
    };
  }, [onMessage, onConnect, onDisconnect, onError]);

  // 基礎工具函數 - 無依賴
  const clearTimers = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const updateConnectionQuality = useCallback(() => {
    if (!isConnected) {
      setConnectionQuality(ConnectionQualityType.DISCONNECTED);
      return;
    }

    const now = Date.now();
    const timeSinceLastHeartbeat = now - lastHeartbeatRef.current;

    if (consecutiveFailuresRef.current >= CONNECTION_QUALITY_THRESHOLD || timeSinceLastHeartbeat > HEARTBEAT_INTERVAL * 2) {
      setConnectionQuality(ConnectionQualityType.POOR);
    } else {
      setConnectionQuality(ConnectionQualityType.GOOD);
    }
  }, [isConnected]);

  const disconnect = useCallback(() => {
    clearTimers();
    isReconnectingRef.current = false;

    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }

    setIsConnected(false);
    setOnlineCount(0);
    setConnectionQuality(ConnectionQualityType.DISCONNECTED);
  }, [clearTimers]);

  // 重連相關函數 - 使用 ref 避免循環依賴
  const scheduleReconnectRef = useRef<() => void>();
  const startHeartbeatRef = useRef<() => void>();
  const connectInternalRef = useRef<() => void>();

  // 重連邏輯
  scheduleReconnectRef.current = useCallback(() => {
    if (
      !isMounted.current ||
      !enabled ||
      reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS ||
      isReconnectingRef.current
    ) {
      return;
    }

    isReconnectingRef.current = true;
    const delay = RECONNECT_DELAYS[Math.min(reconnectAttemptsRef.current, RECONNECT_DELAYS.length - 1)];

    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMounted.current && enabled && !isConnected) {
        reconnectAttemptsRef.current++;

        // 清理當前連線
        if (channelRef.current) {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }

        // 重新建立連線
        connectInternalRef.current?.();
      }
      isReconnectingRef.current = false;
    }, delay);
  }, [enabled, isConnected]);

  // 心跳檢測
  startHeartbeatRef.current = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    const sendHeartbeat = () => {
      if (!channelRef.current || !isConnected || !isMounted.current) {
        return;
      }

      const now = Date.now();
      const timeSinceActivity = now - lastActivityRef.current;
      const isUserIdle = timeSinceActivity > USER_ACTIVITY_TIMEOUT;

      // 如果用戶閒置，降低心跳頻率
      const heartbeatInterval = isUserIdle ? IDLE_HEARTBEAT_INTERVAL : HEARTBEAT_INTERVAL;

      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { timestamp: now, userId },
        });

        lastHeartbeatRef.current = now;
        consecutiveFailuresRef.current = 0;
        updateConnectionQuality();
      } catch (error) {
        consecutiveFailuresRef.current++;
        updateConnectionQuality();

        if (consecutiveFailuresRef.current >= CONNECTION_QUALITY_THRESHOLD) {
          console.warn('💓 [HEARTBEAT] 多次心跳失敗，可能需要重新連線');
          scheduleReconnectRef.current?.();
        }
      }

      // 重新設定定時器
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
      heartbeatRef.current = setTimeout(sendHeartbeat, heartbeatInterval);
    };

    // 立即發送第一次心跳
    sendHeartbeat();
  }, [isConnected, userId, updateConnectionQuality]);

  // 連線邏輯
  connectInternalRef.current = useCallback(() => {
    if (!isMounted.current || !enabled || !tournamentId) {
      return;
    }

    // 如果已經在連線中，不要重複連線
    if (channelRef.current) {
      return;
    }

    try {
      const channelName = `tournament_${tournamentId}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      channelRef.current = channel;

      // 處理廣播訊息
      channel.on('broadcast', { event: 'tournament_update' }, (payload: SupabaseBroadcastPayload) => {
        if (!isMounted.current) return;

        const message = payload.payload;

        if (message.fromUserId === userId) {
          return;
        }

        setLastMessage(message);
        callbacksRef.current.onMessage?.(message);
        updateActivity();
      });

      // 處理心跳回應
      channel.on('broadcast', { event: 'heartbeat' }, () => {
        updateActivity();
      });

      // Presence 事件處理
      channel.on('presence', { event: 'sync' }, () => {
        if (!isMounted.current) return;
        const presenceState = channel.presenceState() as PresenceState;
        const userCount = Object.keys(presenceState).length;
        setOnlineCount(userCount);
        updateActivity();
      });

      channel.on('presence', { event: 'join' }, () => {
        if (!isMounted.current) return;
        const presenceState = channel.presenceState() as PresenceState;
        setOnlineCount(Object.keys(presenceState).length);
        updateActivity();
      });

      channel.on('presence', { event: 'leave' }, () => {
        if (!isMounted.current) return;
        const presenceState = channel.presenceState() as PresenceState;
        setOnlineCount(Object.keys(presenceState).length);
      });

      // 訂閱狀態處理
      channel.subscribe(async (status: SubscriptionStatus) => {
        if (!isMounted.current) return;

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
          consecutiveFailuresRef.current = 0;
          lastHeartbeatRef.current = Date.now();
          isReconnectingRef.current = false;

          const presenceData: PresenceData = {
            userId,
            userType: userId.startsWith('editor_') ? 'editor' : 'viewer',
            joinTime: new Date().toISOString(),
          };

          await channel.track(presenceData);
          callbacksRef.current.onConnect?.();

          // 開始心跳檢測
          startHeartbeatRef.current?.();
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          consecutiveFailuresRef.current++;
          updateConnectionQuality();
          callbacksRef.current.onError?.(new Error('Channel error'));
          scheduleReconnectRef.current?.();
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          consecutiveFailuresRef.current++;
          updateConnectionQuality();
          callbacksRef.current.onError?.(new Error('Connection timeout'));
          scheduleReconnectRef.current?.();
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          setConnectionQuality(ConnectionQualityType.DISCONNECTED);
          callbacksRef.current.onDisconnect?.();
          scheduleReconnectRef.current?.();
        }
      });
    } catch (error) {
      setIsConnected(false);
      setConnectionQuality(ConnectionQualityType.DISCONNECTED);
      const errorMessage = error instanceof Error ? error : new Error('Unknown connection error');
      callbacksRef.current.onError?.(errorMessage);
      scheduleReconnectRef.current?.();
    }
  }, [enabled, tournamentId, userId, updateActivity, updateConnectionQuality]);

  // 手動重連函數
  const reconnect = useCallback(() => {
    if (isReconnectingRef.current) {
      return;
    }

    reconnectAttemptsRef.current = 0;
    isReconnectingRef.current = true;

    disconnect();

    setTimeout(() => {
      if (isMounted.current) {
        connectInternalRef.current?.();
      }
      isReconnectingRef.current = false;
    }, 1000);
  }, [disconnect]);

  const sendMessage = useCallback(
    (message: Partial<RealtimeMessage>): boolean => {
      if (!channelRef.current || !isConnected) {
        return false;
      }

      const fullMessage: RealtimeMessage = {
        type: message.type || RealtimeMessageType.TEST_UPDATE,
        data: message.data,
        timestamp: new Date().toISOString(),
        fromUserId: userId,
        tournamentId,
        ...('message' in message ? { message: message.message } : {}),
      } as RealtimeMessage;

      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'tournament_update',
          payload: fullMessage,
        });

        updateActivity();
        return true;
      } catch (error) {
        consecutiveFailuresRef.current++;
        updateConnectionQuality();
        return false;
      }
    },
    [userId, tournamentId, isConnected, updateActivity, updateConnectionQuality]
  );

  const broadcastUpdate = useCallback(
    async (updateData: BroadcastUpdateData): Promise<boolean> => {
      if (!channelRef.current || !isConnected) {
        return false;
      }

      let message: RealtimeMessage;

      switch (updateData.type) {
        case RealtimeMessageType.PLAYER_UPDATE:
          message = {
            type: RealtimeMessageType.PLAYER_UPDATE,
            data: updateData.data,
            timestamp: new Date().toISOString(),
            fromUserId: userId,
            tournamentId,
          } as RealtimeMessage;
          break;

        case RealtimeMessageType.MATCH_UPDATE:
          message = {
            type: RealtimeMessageType.MATCH_UPDATE,
            data: updateData.data,
            timestamp: new Date().toISOString(),
            fromUserId: userId,
            tournamentId,
          } as RealtimeMessage;
          break;

        case RealtimeMessageType.ANNOUNCEMENT:
          message = {
            type: RealtimeMessageType.ANNOUNCEMENT,
            message: updateData.message as string,
            timestamp: new Date().toISOString(),
            fromUserId: userId,
            tournamentId,
          } as RealtimeMessage;
          break;

        case RealtimeMessageType.TEST_UPDATE:
          message = {
            type: RealtimeMessageType.TEST_UPDATE,
            message: updateData.message as string,
            timestamp: new Date().toISOString(),
            fromUserId: userId,
            tournamentId,
          } as RealtimeMessage;
          break;

        case RealtimeMessageType.REFRESH_REQUEST:
          message = {
            type: RealtimeMessageType.REFRESH_REQUEST,
            timestamp: new Date().toISOString(),
            fromUserId: userId,
            tournamentId,
          } as RealtimeMessage;
          break;

        case RealtimeMessageType.DRAWING_UPDATE:
          message = {
            type: RealtimeMessageType.DRAWING_UPDATE,
            data: updateData.data,
            timestamp: new Date().toISOString(),
            fromUserId: userId,
            tournamentId,
          } as RealtimeMessage;
          break;

        default:
          message = {
            type: RealtimeMessageType.TOURNAMENT_UPDATED,
            data: updateData.data || updateData,
            timestamp: new Date().toISOString(),
            fromUserId: userId,
            tournamentId,
            ...(updateData.action && { action: updateData.action }),
          } as RealtimeMessage;
      }

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'tournament_update',
          payload: message,
        });

        updateActivity();
        return true;
      } catch (error) {
        consecutiveFailuresRef.current++;
        updateConnectionQuality();
        return false;
      }
    },
    [userId, tournamentId, isConnected, updateActivity, updateConnectionQuality]
  );

  // 監聽用戶活動
  useEffect(() => {
    const handleUserActivity = () => {
      updateActivity();

      // 如果斷線且用戶有活動，嘗試重新連線
      if (!isConnected && enabled && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS && !isReconnectingRef.current) {
        reconnect();
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach((event) => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserActivity);
      });
    };
  }, [updateActivity, isConnected, enabled, reconnect]);

  // 監聽頁面可見性變化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMounted.current) return;

      updateActivity();

      if (!document.hidden && enabled && !isConnected && tournamentId && !isReconnectingRef.current) {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, isConnected, reconnect, tournamentId, updateActivity]);

  // 網路狀態監聽
  useEffect(() => {
    const handleOnline = () => {
      updateActivity();
      if (enabled && !isConnected && tournamentId && !isReconnectingRef.current) {
        reconnect();
      }
    };

    const handleOffline = () => {
      setConnectionQuality(ConnectionQualityType.DISCONNECTED);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [enabled, isConnected, reconnect, tournamentId, updateActivity]);

  // 主要連線效果
  useEffect(() => {
    isMounted.current = true;

    if (enabled && tournamentId) {
      connectInternalRef.current?.();
    } else {
      disconnect();
    }

    return () => {
      isMounted.current = false;
      clearTimers();
      disconnect();
    };
  }, [enabled, tournamentId, disconnect, clearTimers]);

  return {
    isConnected,
    onlineCount,
    sendMessage,
    broadcastUpdate,
    lastMessage,
    reconnect,
    connectionQuality,
  };
}
