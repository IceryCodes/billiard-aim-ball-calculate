import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ArticleGenerationMessage,
  ArticleGenerationPresenceData,
  ArticleGenerationStatusType,
} from '@/domains/article-realtime';
import { RealtimeChannel, supabase } from '@/lib/supabase';

interface SupabaseBroadcastPayload {
  payload: ArticleGenerationMessage;
}

interface UseArticleGenerationProps {
  jobId: string | null;
  enabled?: boolean;
  onStatusUpdate?: (message: ArticleGenerationMessage) => void;
  onComplete?: (data: { articleTitle: string; articleUrl: string }) => void;
  onError?: (error: string) => void;
}

interface UseArticleGenerationReturn {
  isConnected: boolean;
  currentStatus: ArticleGenerationStatusType | null;
  currentMessage: string;
  lastUpdate: ArticleGenerationMessage | null;
  disconnect: () => void;
}

export function useArticleGeneration({
  jobId,
  enabled = true,
  onStatusUpdate,
  onComplete,
  onError,
}: UseArticleGenerationProps): UseArticleGenerationReturn {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const isMountedRef = useRef(true);

  const [isConnected, setIsConnected] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<ArticleGenerationStatusType | null>(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [lastUpdate, setLastUpdate] = useState<ArticleGenerationMessage | null>(null);

  // 使用 useRef 來存儲回調，避免依賴變化
  const callbacksRef = useRef({
    onStatusUpdate,
    onComplete,
    onError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onStatusUpdate,
      onComplete,
      onError,
    };
  }, [onStatusUpdate, onComplete, onError]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
      } catch (error) {
        console.warn('⚠️ 取消訂閱時發生錯誤:', error);
      }
      channelRef.current = null;
    }

    if (isMountedRef.current) {
      setIsConnected(false);
      setCurrentStatus(null);
      setCurrentMessage('');
    }
  }, []);

  const handleMessage = useCallback(
    (payload: SupabaseBroadcastPayload) => {
      if (!isMountedRef.current) return;

      const message = payload.payload;

      if (message.jobId !== jobId) return;

      setLastUpdate(message);
      setCurrentStatus(message.status);
      setCurrentMessage(message.message);

      // 執行回調
      if (callbacksRef.current.onStatusUpdate) {
        callbacksRef.current.onStatusUpdate(message);
      }

      // 處理完成狀態
      if (
        message.status === ArticleGenerationStatusType.COMPLETED &&
        message.data?.articleTitle &&
        message.data?.articleUrl
      ) {
        if (callbacksRef.current.onComplete) {
          callbacksRef.current.onComplete({
            articleTitle: message.data.articleTitle,
            articleUrl: message.data.articleUrl,
          });
        }
      }

      // 處理錯誤狀態
      if (message.status === ArticleGenerationStatusType.ERROR && message.data?.error) {
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(message.data.error);
        }
      }
    },
    [jobId]
  );

  const connect = useCallback(() => {
    if (!jobId || !enabled || channelRef.current) return;

    try {
      const channelName = `article_generation_${jobId}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: `user_${Date.now()}`,
          },
        },
      });

      channelRef.current = channel;

      // 處理廣播訊息
      channel.on('broadcast', { event: 'article_generation_update' }, handleMessage);

      // 訂閱狀態處理
      channel.subscribe(async (status) => {
        if (!isMountedRef.current) return;

        switch (status) {
          case 'SUBSCRIBED': {
            setIsConnected(true);

            const presenceData: ArticleGenerationPresenceData = {
              userId: `user_${Date.now()}`,
              jobId,
              startTime: new Date().toISOString(),
            };

            try {
              await channel.track(presenceData);
            } catch (error) {
              console.error('❌ Presence 追蹤失敗:', error);
            }
            break;
          }

          case 'CHANNEL_ERROR':
          case 'TIMED_OUT':
          case 'CLOSED': {
            setIsConnected(false);
            console.error('❌ Channel 連接錯誤:', status);
            break;
          }
        }
      });
    } catch (error) {
      console.error('❌ 建立連接失敗:', error);
      setIsConnected(false);
    }
  }, [jobId, enabled, handleMessage]);

  // 主要連線 effect
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled && jobId) {
      connect();
    }

    return () => {
      isMountedRef.current = false;
      disconnect();
    };
  }, [enabled, jobId, connect, disconnect]);

  return {
    isConnected,
    currentStatus,
    currentMessage,
    lastUpdate,
    disconnect,
  };
}
