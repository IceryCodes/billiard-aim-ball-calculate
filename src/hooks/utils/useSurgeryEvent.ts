// useSurgeryEvent.ts
import { useCallback, useEffect, useRef, useState } from 'react';

import { v4 as uuidv4 } from 'uuid';

interface UpdateResult {
  success: boolean;
  unchanged?: boolean;
  currentState?: boolean;
  message?: string;
}

interface UseSurgeryEventProps {
  hospitalId: string;
  onSurgeryUpdate: (surgery: boolean) => void;
  enabled?: boolean;
}

export const useSurgeryEvent = ({ hospitalId, onSurgeryUpdate, enabled = true }: UseSurgeryEventProps) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const currentStateRef = useRef<boolean | null>(null);
  const tabIdRef = useRef<string>(uuidv4());
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      // console.log(`[Client ${tabIdRef.current}] Cleaning up SSE connection`);
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    const setupEventSource = () => {
      if (!enabled || !hospitalId) return;

      cleanup();

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
      const eventSource = new EventSource(
        `${baseUrl}/hospital-surgery-events?hospitalId=${hospitalId}&tabId=${tabIdRef.current}`
      );

      const handleMessage = (event: MessageEvent, type: string) => {
        try {
          const data = JSON.parse(event.data);
          // console.log(`[Client ${tabIdRef.current}] Received ${type}:`, data);
          if (typeof data.surgery === 'boolean') {
            currentStateRef.current = data.surgery;
            onSurgeryUpdate(data.surgery);
          }
        } catch (error) {
          console.error(`[Client ${tabIdRef.current}] Error handling ${type}:`, error);
        }
      };

      const handleOpen = () => {
        // console.log(`[Client ${tabIdRef.current}] SSE Connection opened`);
        setIsConnected(true);
        retryCountRef.current = 0;
      };

      const handleError = (error: Event) => {
        if (process.env.NODE_ENV === 'development')
          console.error(`[Client ${tabIdRef.current}] SSE Connection error:`, error);

        cleanup();

        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
          // console.log(
          //   `[Client ${tabIdRef.current}] Retrying in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`
          // );
          setTimeout(setupEventSource, delay);
        } else {
          // console.log(`[Client ${tabIdRef.current}] Max retries reached, giving up`);
        }
      };

      // 設置事件監聽器
      eventSource.addEventListener('initialState', (e) => handleMessage(e, 'initial state'));
      eventSource.addEventListener('surgeryUpdate', (e) => handleMessage(e, 'surgery update'));
      // eventSource.addEventListener('ping', () => console.log(`[Client ${tabIdRef.current}] Connection alive`));
      eventSource.addEventListener('open', handleOpen);
      eventSource.addEventListener('error', handleError);

      eventSourceRef.current = eventSource;

      // 頁面卸載時清理
      const handleBeforeUnload = () => cleanup();
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        cleanup();
      };
    };

    setupEventSource();
  }, [cleanup, enabled, hospitalId, onSurgeryUpdate]);

  const updateSurgeryState = useCallback(
    async (newSurgery: boolean): Promise<UpdateResult> => {
      if (!isConnected) {
        console.warn(`[Client ${tabIdRef.current}] No SSE connection`);
        return { success: false, message: 'No connection' };
      }

      try {
        // console.log(`[Client ${tabIdRef.current}] Updating surgery state:`, newSurgery);
        const response = await fetch('/api/update-hospital-surgery', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            _id: hospitalId,
            surgery: newSurgery,
            tabId: tabIdRef.current,
          }),
        });

        const result = await response.json();

        if (result.message === 'Surgery status unchanged') {
          return { success: true, unchanged: true, currentState: newSurgery };
        }

        if (result.message?.includes('success')) {
          currentStateRef.current = newSurgery;
          return { success: true, currentState: newSurgery };
        }

        return {
          success: false,
          message: result.message,
          currentState: currentStateRef.current ?? false,
        };
      } catch (error) {
        console.error(`[Client ${tabIdRef.current}] Failed to update surgery state:`, error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Update failed',
          currentState: currentStateRef.current ?? false,
        };
      }
    },
    [hospitalId, isConnected]
  );

  return {
    updateSurgeryState,
    isConnected,
    currentState: currentStateRef.current,
    tabId: tabIdRef.current,
  };
};
