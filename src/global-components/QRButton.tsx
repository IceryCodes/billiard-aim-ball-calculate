'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

interface QRSession {
  sessionId: string;
  qrCodeDataUrl: string;
  expiresAt: string;
}

interface OCRResult {
  text: string;
  confidence: number;
}

interface SessionStatusResponse {
  status: 'waiting' | 'completed' | 'expired' | 'not-found';
  result?: OCRResult;
}

const QRButton: React.FC = () => {
  const [session, setSession] = useState<QRSession | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const generateQR = async (): Promise<void> => {
    try {
      const response = await fetch('/api/qr-session', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setSession(data);
        setTimeLeft(300); // 5 minutes
        startPolling(data.sessionId);
      }
    } catch (error) {
      console.error('生成 QR 碼失敗:', error);
    }
  };

  const startPolling = (sessionId: string): void => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/qr-session?id=${sessionId}`);
        const data: SessionStatusResponse = await response.json();

        if (data.status === 'completed' && data.result) {
          setResult(data.result);
          if (intervalRef.current) clearInterval(intervalRef.current);
        } else if (data.status === 'expired' || data.status === 'not-found') {
          reset();
        }
      } catch (error) {
        console.error('輪詢錯誤:', error);
      }
    }, 2000);
  };

  const reset = (): void => {
    setSession(null);
    setResult(null);
    setTimeLeft(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (session) {
      reset();
    }
  }, [timeLeft, session]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (result) {
    return (
      <div className="p-4 border rounded bg-green-50">
        <div className="mb-2 font-medium">識別結果 ({result.confidence.toFixed(1)}%)</div>
        <pre className="whitespace-pre-wrap text-sm bg-white text-black p-2 border rounded max-h-40 overflow-auto">
          {result.text}
        </pre>
        <button onClick={reset} className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600">
          重新開始
        </button>
      </div>
    );
  }

  if (session) {
    return (
      <div className="p-4 border rounded">
        <div className="text-center mb-4">
          <Image
            src={session.qrCodeDataUrl}
            alt={`${process.env.NEXT_PUBLIC_SITENAME} 名單導入QR code`}
            width={150}
            height={150}
            className="mx-auto border rounded"
            placeholder="blur"
            blurDataURL={session.qrCodeDataUrl}
          />
          <div className="mt-2 text-sm text-gray-600">
            剩餘: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
        <button onClick={reset} className="w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          取消
        </button>
      </div>
    );
  }

  return (
    <button onClick={generateQR} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
      生成上傳 QR 碼
    </button>
  );
};

export default QRButton;
