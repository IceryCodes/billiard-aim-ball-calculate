// features/useTournamentRealtime.ts - 最終修正版本
import { useCallback, useEffect, useRef, useState } from 'react';

import { BroadcastUpdateData, PresenceData, RealtimeMessage } from '@/domains/realtime';
import { RealtimeMessageType } from '@/domains/tournament';
import { RealtimeChannel, supabase } from '@/lib/supabase';

// Supabase realtime 的狀態類型
type SubscriptionStatus = 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED';

// Supabase 廣播 payload 的類型
interface SupabaseBroadcastPayload {
  payload: RealtimeMessage;
}

// Hook 的參數類型
interface UseRealtimeProps {
  tournamentId: string;
  userId?: string;
  enabled?: boolean;
  onMessage?: (message: RealtimeMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error | string) => void;
}

// Hook 的返回類型
interface UseRealtimeReturn {
  isConnected: boolean;
  onlineCount: number;
  sendMessage: (message: Partial<RealtimeMessage>) => boolean;
  broadcastUpdate: (updateData: BroadcastUpdateData) => Promise<boolean>;
  lastMessage: RealtimeMessage | null;
  reconnect: () => void;
}

// Supabase presence 狀態類型
interface PresenceState {
  [key: string]: PresenceData[];
}

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
  const [isConnected, setIsConnected] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null);

  // 防止無限迴圈 - 將回調函數包裝在 useRef 中
  const callbacksRef = useRef({
    onMessage,
    onConnect,
    onDisconnect,
    onError,
  });

  // 更新回調函數引用
  useEffect(() => {
    callbacksRef.current = {
      onMessage,
      onConnect,
      onDisconnect,
      onError,
    };
  }, [onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      // console.log('🔌 [REALTIME] 手動斷開連線');
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setIsConnected(false);
    setOnlineCount(0);
  }, []);

  const connect = useCallback(() => {
    if (!isMounted.current || !enabled || !tournamentId) {
      // console.log('⏸️ [REALTIME] 連線條件不滿足');
      return;
    }

    // 斷開舊連線
    disconnect();

    try {
      // 創建頻道
      const channelName = `tournament_${tournamentId}`;
      // console.log('🔗 [REALTIME] 連線頻道:', channelName);

      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: userId,
          },
        },
      });

      channelRef.current = channel;

      // 監聽廣播訊息
      channel.on('broadcast', { event: 'tournament_update' }, (payload: SupabaseBroadcastPayload) => {
        if (!isMounted.current) return;

        // console.log('📨 [REALTIME] 收到廣播:', payload);
        const message = payload.payload;

        // 忽略自己發送的訊息
        if (message.fromUserId === userId) {
          // console.log('⏭️ [REALTIME] 忽略自己的訊息');
          return;
        }

        setLastMessage(message);
        callbacksRef.current.onMessage?.(message);
      });

      // 監聽用戶上線/下線
      channel.on('presence', { event: 'sync' }, () => {
        if (!isMounted.current) return;

        const presenceState = channel.presenceState() as PresenceState;
        const userCount = Object.keys(presenceState).length;

        // console.log('👥 [REALTIME] 在線用戶數:', userCount);
        setOnlineCount(userCount);
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      channel.on('presence', { event: 'join' }, ({ key }: { key: string }) => {
        if (!isMounted.current) return;

        // console.log('👤 [REALTIME] 用戶加入:', key);
        const presenceState = channel.presenceState() as PresenceState;
        setOnlineCount(Object.keys(presenceState).length);
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      channel.on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        if (!isMounted.current) return;

        // console.log('👋 [REALTIME] 用戶離開:', key);
        const presenceState = channel.presenceState() as PresenceState;
        setOnlineCount(Object.keys(presenceState).length);
      });

      // 訂閱頻道
      channel.subscribe(async (status: SubscriptionStatus) => {
        if (!isMounted.current) return;

        // console.log('📡 [REALTIME] 訂閱狀態:', status);

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          // console.log('✅ [REALTIME] 連線成功');

          // 設置 presence
          const presenceData: PresenceData = {
            userId,
            userType: userId.startsWith('editor_') ? 'editor' : 'viewer',
            joinTime: new Date().toISOString(),
          };

          await channel.track(presenceData);

          callbacksRef.current.onConnect?.();
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          console.error('❌ [REALTIME] 頻道錯誤');
          callbacksRef.current.onError?.(new Error('Channel error'));
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          console.error('⏰ [REALTIME] 連線超時');
          callbacksRef.current.onError?.(new Error('Connection timeout'));
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          // console.log('🔌 [REALTIME] 連線關閉');
          callbacksRef.current.onDisconnect?.();
        }
      });
    } catch (error) {
      console.error('❌ [REALTIME] 連線失敗:', error);
      setIsConnected(false);
      const errorMessage = error instanceof Error ? error : new Error('Unknown connection error');
      callbacksRef.current.onError?.(errorMessage);
    }
  }, [tournamentId, userId, enabled, disconnect]);

  const sendMessage = useCallback(
    (message: Partial<RealtimeMessage>): boolean => {
      if (!channelRef.current || !isConnected) {
        console.warn('⚠️ [REALTIME] 頻道未連線，無法發送訊息');
        return false;
      }

      // 創建完整的訊息，確保有必要的屬性
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

        // console.log('📤 [REALTIME] 發送訊息成功:', fullMessage.type);
        return true;
      } catch (error) {
        console.error('❌ [REALTIME] 發送訊息失敗:', error);
        return false;
      }
    },
    [userId, tournamentId, isConnected]
  );

  const broadcastUpdate = useCallback(
    async (updateData: BroadcastUpdateData): Promise<boolean> => {
      // console.log('🚀 [REALTIME] broadcastUpdate 被調用');
      // console.log('📊 [REALTIME] updateData:', updateData);

      if (!channelRef.current || !isConnected) {
        console.error('❌ [REALTIME] 頻道未連線');
        return false;
      }

      // 根據不同的類型創建對應的訊息
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

        default:
          // 預設為 tournamentUpdated
          message = {
            type: RealtimeMessageType.TOURNAMENT_UPDATED,
            data: updateData.data || updateData,
            timestamp: new Date().toISOString(),
            fromUserId: userId,
            tournamentId,
            ...(updateData.action && { action: updateData.action }),
          } as RealtimeMessage;
      }

      // console.log('📤 [REALTIME] 準備廣播訊息:', message);

      try {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'tournament_update',
          payload: message,
        });

        // console.log('✅ [REALTIME] 廣播訊息發送成功');
        return true;
      } catch (error) {
        console.error('❌ [REALTIME] 廣播訊息發送失敗:', error);
        return false;
      }
    },
    [userId, tournamentId, isConnected]
  );

  const reconnect = useCallback(() => {
    // console.log('🔄 [REALTIME] 手動重連');
    disconnect();
    setTimeout(() => {
      if (isMounted.current) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect]);

  // 主要連線效果
  useEffect(() => {
    isMounted.current = true;

    if (enabled && tournamentId) {
      // console.log('🚀 [REALTIME] 初始化連線');
      connect();
    } else {
      // console.log('⏸️ [REALTIME] 連線被禁用或缺少 tournamentId');
      disconnect();
    }

    return () => {
      isMounted.current = false;
      disconnect();
    };
  }, [enabled, tournamentId, connect, disconnect]);

  // 頁面可見性變化處理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMounted.current) return;

      if (!document.hidden && enabled && !isConnected && tournamentId) {
        // console.log('👁️ [REALTIME] 頁面重新可見，嘗試重連');
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, isConnected, reconnect, tournamentId]);

  return {
    isConnected,
    onlineCount,
    sendMessage,
    broadcastUpdate,
    lastMessage,
    reconnect,
  };
}
