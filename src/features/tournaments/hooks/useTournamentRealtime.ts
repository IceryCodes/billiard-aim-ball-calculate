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

// 保持原有的穩定連線配置，只做最小優化
const HEARTBEAT_INTERVAL = 30000; // 30秒心跳檢測 - 保持不變
const MAX_RECONNECT_ATTEMPTS = 5; // 增加重連次數，提高穩定性
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]; // 恢復原有延遲，確保穩定性
const CONNECTION_QUALITY_THRESHOLD = 3; // 增加閾值，減少誤判
const MESSAGE_PROCESSING_TIMEOUT = 200; // 提高超時閾值，減少警告

export function useTournamentRealtime({
  tournamentId,
  userId = 'anonymous',
  enabled = true,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UseRealtimeProps): UseRealtimeReturn {
  // ==================== Refs 和狀態管理 ====================

  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const consecutiveFailuresRef = useRef<number>(0);
  const isReconnectingRef = useRef<boolean>(false);
  const processingMessageRef = useRef<boolean>(false);
  const lastMessageTimeRef = useRef<number>(Date.now());

  // 只在開發環境做輕微優化，不影響生產環境
  const isInitialMount = useRef(true);
  const isDevelopment = process.env.NODE_ENV === 'development';

  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<ConnectionQualityType>(ConnectionQualityType.DISCONNECTED);
  const [shouldConnect, setShouldConnect] = useState(!isDevelopment);

  // 使用 useRef 來存儲回調，避免依賴變化
  const callbacksRef = useRef({
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  });

  // 更新回調
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onConnect,
      onDisconnect,
      onError,
    };
  }, [onMessage, onConnect, onDisconnect, onError]);

  // 只在開發環境做輕微延遲，生產環境立即連接
  useEffect(() => {
    if (isDevelopment && isInitialMount.current) {
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          setShouldConnect(true);
        }
        isInitialMount.current = false;
      }, 300); // 最小延遲，只為避免熱重載問題

      return () => clearTimeout(timer);
    }
    isInitialMount.current = false;
  }, [isDevelopment]);

  // 有效的啟用狀態
  const effectiveEnabled = enabled && shouldConnect;

  // ==================== 基礎工具函數 ====================

  const safeSetState = useCallback((updateFn: () => void) => {
    if (isMountedRef.current) {
      try {
        updateFn();
      } catch (error) {
        console.error('❌ 狀態更新失敗:', error);
      }
    }
  }, []);

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

  // ==================== 連線品質和斷線處理 ====================

  const updateConnectionQuality = useCallback(() => {
    safeSetState(() => {
      if (!isConnected) {
        setConnectionQuality(ConnectionQualityType.DISCONNECTED);
        return;
      }

      if (consecutiveFailuresRef.current >= CONNECTION_QUALITY_THRESHOLD) {
        setConnectionQuality(ConnectionQualityType.POOR);
      } else {
        setConnectionQuality(ConnectionQualityType.GOOD);
      }
    });
  }, [isConnected, safeSetState]);

  const disconnect = useCallback(() => {
    clearTimers();
    isReconnectingRef.current = false;
    processingMessageRef.current = false;

    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
      } catch (error) {
        console.warn('⚠️ 取消訂閱時發生錯誤:', error);
      }
      channelRef.current = null;
    }

    safeSetState(() => {
      setIsConnected(false);
      setOnlineCount(0);
      setConnectionQuality(ConnectionQualityType.DISCONNECTED);
    });
  }, [clearTimers, safeSetState]);

  // ==================== 訊息處理 ====================

  const handleMessage = useCallback(
    (payload: SupabaseBroadcastPayload) => {
      if (!isMountedRef.current || processingMessageRef.current) {
        return;
      }

      processingMessageRef.current = true;
      const startTime = Date.now();

      try {
        const message = payload.payload;

        if (message.fromUserId === userId) {
          return;
        }

        // 保持頻率限制，但放寬限制，確保不丟失重要消息
        const timeSinceLastMessage = startTime - lastMessageTimeRef.current;
        if (timeSinceLastMessage < 10) {
          // 降低到 10ms，確保不丟失消息
          return;
        }

        lastMessageTimeRef.current = startTime;

        safeSetState(() => {
          setLastMessage(message);
        });

        // 立即處理回調，不延遲，確保即時性
        if (isMountedRef.current && callbacksRef.current.onMessage) {
          try {
            callbacksRef.current.onMessage(message);
          } catch (error) {
            console.error('❌ 訊息處理回調錯誤:', error);
          }
        }

        // 只在開發環境記錄性能警告
        if (isDevelopment) {
          const processingTime = Date.now() - startTime;
          if (processingTime > MESSAGE_PROCESSING_TIMEOUT) {
            console.warn(`⚠️ 訊息處理時間過長: ${processingTime}ms`);
          }
        }
      } catch (error) {
        console.error('❌ 訊息處理錯誤:', error);
      } finally {
        processingMessageRef.current = false;
      }
    },
    [userId, safeSetState, isDevelopment]
  );

  // ==================== 先聲明所有需要相互依賴的函數 ====================

  // 重連邏輯 - 保持原有穩定性
  const scheduleReconnectInternal = useCallback(() => {
    if (
      !isMountedRef.current ||
      !effectiveEnabled ||
      reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS ||
      isReconnectingRef.current
    ) {
      return;
    }

    isReconnectingRef.current = true;
    const delay = RECONNECT_DELAYS[Math.min(reconnectAttemptsRef.current, RECONNECT_DELAYS.length - 1)];

    reconnectTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current && effectiveEnabled && !isConnected) {
        reconnectAttemptsRef.current++;

        if (channelRef.current) {
          try {
            channelRef.current.unsubscribe();
          } catch (error) {
            console.warn('⚠️ 重連時取消訂閱失敗:', error);
          }
          channelRef.current = null;
        }

        // 直接調用，不額外延遲
        if (isMountedRef.current) {
          connectInternalRef.current?.();
        }
      }
      isReconnectingRef.current = false;
    }, delay);
  }, [effectiveEnabled, isConnected]);

  // 使用 ref 來存儲 connectInternal 函數，避免循環依賴
  const connectInternalRef = useRef<(() => void) | null>(null);

  // 連線建立邏輯
  const connectInternal = useCallback(() => {
    if (!isMountedRef.current || !effectiveEnabled || !tournamentId || channelRef.current) {
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
      channel.on('broadcast', { event: 'tournament_update' }, handleMessage);

      // 處理心跳回應
      channel.on('broadcast', { event: 'heartbeat' }, () => {
        // 簡單記錄心跳回應
      });

      // Presence 事件處理 - 保持原有即時性
      channel.on('presence', { event: 'sync' }, () => {
        if (!isMountedRef.current) return;
        const presenceState = channel.presenceState() as PresenceState;
        const userCount = Object.keys(presenceState).length;
        safeSetState(() => {
          setOnlineCount(userCount);
        });
      });

      channel.on('presence', { event: 'join' }, () => {
        if (!isMountedRef.current) return;
        const presenceState = channel.presenceState() as PresenceState;
        safeSetState(() => {
          setOnlineCount(Object.keys(presenceState).length);
        });
      });

      channel.on('presence', { event: 'leave' }, () => {
        if (!isMountedRef.current) return;
        const presenceState = channel.presenceState() as PresenceState;
        safeSetState(() => {
          setOnlineCount(Object.keys(presenceState).length);
        });
      });

      // 訂閱狀態處理
      channel.subscribe(async (status: SubscriptionStatus) => {
        if (!isMountedRef.current) return;

        switch (status) {
          case 'SUBSCRIBED': {
            safeSetState(() => {
              setIsConnected(true);
            });
            reconnectAttemptsRef.current = 0;
            consecutiveFailuresRef.current = 0;
            isReconnectingRef.current = false;

            const presenceData: PresenceData = {
              userId,
              userType: userId.startsWith('editor_') ? 'editor' : 'viewer',
              joinTime: new Date().toISOString(),
            };

            try {
              await channel.track(presenceData);
              callbacksRef.current.onConnect?.();
              startHeartbeatRef.current?.();
            } catch (error) {
              console.error('❌ Presence 追蹤失敗:', error);
            }
            break;
          }

          case 'CHANNEL_ERROR':
          case 'TIMED_OUT': {
            safeSetState(() => {
              setIsConnected(false);
            });
            consecutiveFailuresRef.current++;
            updateConnectionQuality();
            console.error('❌ 連接錯誤:', status);
            scheduleReconnectInternal();
            break;
          }

          case 'CLOSED': {
            safeSetState(() => {
              setIsConnected(false);
              setConnectionQuality(ConnectionQualityType.DISCONNECTED);
            });
            callbacksRef.current.onDisconnect?.();
            scheduleReconnectInternal();
            break;
          }
        }
      });
    } catch (error) {
      console.error('❌ 建立連接失敗:', error);
      safeSetState(() => {
        setIsConnected(false);
        setConnectionQuality(ConnectionQualityType.DISCONNECTED);
      });
      scheduleReconnectInternal();
    }
  }, [
    effectiveEnabled,
    tournamentId,
    userId,
    handleMessage,
    safeSetState,
    updateConnectionQuality,
    scheduleReconnectInternal,
  ]);

  // 將 connectInternal 存儲到 ref 中
  useEffect(() => {
    connectInternalRef.current = connectInternal;
  }, [connectInternal]);

  // 使用 ref 來存儲 startHeartbeat 函數
  const startHeartbeatRef = useRef<(() => void) | null>(null);

  // 心跳檢測邏輯
  const startHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
    }

    const sendHeartbeat = () => {
      if (!channelRef.current || !isConnected || !isMountedRef.current) {
        return;
      }

      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'heartbeat',
          payload: { timestamp: Date.now(), userId },
        });

        consecutiveFailuresRef.current = 0;
        updateConnectionQuality();
      } catch (error) {
        consecutiveFailuresRef.current++;
        console.warn('💓 心跳發送失敗:', error);
        updateConnectionQuality();

        if (consecutiveFailuresRef.current >= CONNECTION_QUALITY_THRESHOLD) {
          console.warn('💓 多次心跳失敗，準備重新連線');
          // 適當延遲重連，避免過於頻繁
          setTimeout(() => {
            if (isMountedRef.current && !isReconnectingRef.current) {
              scheduleReconnectInternal();
            }
          }, 1000); // 1秒延遲，確保穩定性
        }
      }
    };

    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  }, [isConnected, userId, updateConnectionQuality, scheduleReconnectInternal]);

  // 將 startHeartbeat 存儲到 ref 中
  useEffect(() => {
    startHeartbeatRef.current = startHeartbeat;
  }, [startHeartbeat]);

  // ==================== 公開 API 函數 ====================

  const reconnect = useCallback(() => {
    if (isReconnectingRef.current) {
      return;
    }

    reconnectAttemptsRef.current = 0;
    disconnect();

    // 適當延遲，確保斷線處理完成
    setTimeout(() => {
      if (isMountedRef.current) {
        connectInternal();
      }
    }, 1000);
  }, [disconnect, connectInternal]);

  const sendMessage = useCallback(
    (message: Partial<RealtimeMessage>): boolean => {
      if (!channelRef.current || !isConnected || !isMountedRef.current) {
        return false;
      }

      try {
        const fullMessage: RealtimeMessage = {
          type: message.type || RealtimeMessageType.TEST_UPDATE,
          data: message.data,
          timestamp: new Date().toISOString(),
          fromUserId: userId,
          tournamentId,
          ...('message' in message ? { message: message.message } : {}),
        } as RealtimeMessage;

        channelRef.current.send({
          type: 'broadcast',
          event: 'tournament_update',
          payload: fullMessage,
        });

        return true;
      } catch (error) {
        console.error('❌ 發送訊息失敗:', error);
        consecutiveFailuresRef.current++;
        updateConnectionQuality();
        return false;
      }
    },
    [userId, tournamentId, isConnected, updateConnectionQuality]
  );

  const broadcastUpdate = useCallback(
    async (updateData: BroadcastUpdateData): Promise<boolean> => {
      if (!channelRef.current || !isConnected || !isMountedRef.current) {
        return false;
      }

      try {
        let message: RealtimeMessage;

        switch (updateData.type) {
          case RealtimeMessageType.GAMER_UPDATE:
          case RealtimeMessageType.MATCH_UPDATE:
          case RealtimeMessageType.DRAWING_UPDATE: {
            message = {
              type: updateData.type,
              data: updateData.data,
              timestamp: new Date().toISOString(),
              fromUserId: userId,
              tournamentId,
            } as RealtimeMessage;
            break;
          }

          case RealtimeMessageType.ANNOUNCEMENT:
          case RealtimeMessageType.TEST_UPDATE: {
            message = {
              type: updateData.type,
              message: updateData.message as string,
              timestamp: new Date().toISOString(),
              fromUserId: userId,
              tournamentId,
            } as RealtimeMessage;
            break;
          }

          case RealtimeMessageType.REFRESH_REQUEST: {
            message = {
              type: updateData.type,
              timestamp: new Date().toISOString(),
              fromUserId: userId,
              tournamentId,
            } as RealtimeMessage;
            break;
          }

          default: {
            message = {
              type: RealtimeMessageType.TOURNAMENT_UPDATED,
              data: updateData.data || updateData,
              timestamp: new Date().toISOString(),
              fromUserId: userId,
              tournamentId,
              ...(updateData.action && { action: updateData.action }),
            } as RealtimeMessage;
            break;
          }
        }

        await channelRef.current.send({
          type: 'broadcast',
          event: 'tournament_update',
          payload: message,
        });

        return true;
      } catch (error) {
        console.error('❌ 廣播更新失敗:', error);
        consecutiveFailuresRef.current++;
        updateConnectionQuality();
        return false;
      }
    },
    [userId, tournamentId, isConnected, updateConnectionQuality]
  );

  // ==================== Effect Hooks ====================

  // 主要連線 effect
  useEffect(() => {
    isMountedRef.current = true;

    if (effectiveEnabled && tournamentId) {
      connectInternal();
    }

    return () => {
      isMountedRef.current = false;
      clearTimers();
      disconnect();
    };
  }, [effectiveEnabled, tournamentId, connectInternal, clearTimers, disconnect]);

  // 頁面可見性變化處理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;

      if (!document.hidden && effectiveEnabled && !isConnected && tournamentId && !isReconnectingRef.current) {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [effectiveEnabled, isConnected, reconnect, tournamentId]);

  // ==================== 返回 API ====================

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
