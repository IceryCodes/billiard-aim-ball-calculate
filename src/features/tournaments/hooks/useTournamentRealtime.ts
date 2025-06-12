import { useCallback, useEffect, useRef, useState } from 'react';

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
}

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

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    setIsConnected(false);
    setOnlineCount(0);
  }, []);

  const connect = useCallback(() => {
    if (!isMounted.current || !enabled || !tournamentId) {
      return;
    }

    disconnect();

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

      channel.on('broadcast', { event: 'tournament_update' }, (payload: SupabaseBroadcastPayload) => {
        if (!isMounted.current) return;

        const message = payload.payload;

        if (message.fromUserId === userId) {
          return;
        }

        setLastMessage(message);
        callbacksRef.current.onMessage?.(message);
      });

      channel.on('presence', { event: 'sync' }, () => {
        if (!isMounted.current) return;

        const presenceState = channel.presenceState() as PresenceState;
        const userCount = Object.keys(presenceState).length;
        setOnlineCount(userCount);
      });

      channel.on('presence', { event: 'join' }, ({ key }: { key: string }) => {
        if (!isMounted.current) return;

        const presenceState = channel.presenceState() as PresenceState;
        setOnlineCount(Object.keys(presenceState).length);
      });

      channel.on('presence', { event: 'leave' }, ({ key }: { key: string }) => {
        if (!isMounted.current) return;

        const presenceState = channel.presenceState() as PresenceState;
        setOnlineCount(Object.keys(presenceState).length);
      });

      channel.subscribe(async (status: SubscriptionStatus) => {
        if (!isMounted.current) return;

        if (status === 'SUBSCRIBED') {
          setIsConnected(true);

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
      if (!channelRef.current || !isConnected) {
        console.error('❌ [REALTIME] 頻道未連線');
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

        return true;
      } catch (error) {
        console.error('❌ [REALTIME] 廣播訊息發送失敗:', error);
        return false;
      }
    },
    [userId, tournamentId, isConnected]
  );

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      if (isMounted.current) {
        connect();
      }
    }, 1000);
  }, [disconnect, connect]);

  useEffect(() => {
    isMounted.current = true;

    if (enabled && tournamentId) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      isMounted.current = false;
      disconnect();
    };
  }, [enabled, tournamentId, connect, disconnect]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMounted.current) return;

      if (!document.hidden && enabled && !isConnected && tournamentId) {
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