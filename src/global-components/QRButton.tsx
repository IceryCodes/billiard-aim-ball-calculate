'use client';

import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { TournamentType } from '@/domains/tournament';
import { getImportNamesFromText } from '@/features/tournaments/helper';

import { Button } from './buttons/Button';
import Card from './Card';
import Popup from './Popup';
import { TournamentSlotEditor } from './tags/TournamentSlotEditor';

interface QRSession {
  sessionId: string;
  qrCodeDataUrl: string;
  uploadUrl: string;
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

type ViewState = 'initial' | 'session' | 'result' | 'editing' | 'final';

interface QRButtonProps {
  gamersCount: number;
  tournamentType: TournamentType;
  onImportNames: (names: string[]) => void;
}

const QRButton = ({ gamersCount, tournamentType, onImportNames }: QRButtonProps): ReactElement => {
  const [session, setSession] = useState<QRSession | null>(null);
  const [result, setResult] = useState<OCRResult | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [viewState, setViewState] = useState<ViewState>('initial');
  const [cleanedNames, setCleanedNames] = useState<string[]>([]);
  const [display, setDisplay] = useState<boolean>(false);
  const [finalOrder, setFinalOrder] = useState<string[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback((): void => {
    setSession(null);
    setResult(null);
    setTimeLeft(0);
    setViewState('initial');
    setCleanedNames([]);
    setFinalOrder([]);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setDisplay(false);
  }, [setFinalOrder]);

  const startPolling = useCallback(
    (sessionId: string): void => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(async () => {
        try {
          const response = await fetch(`/api/qr-session?id=${sessionId}`);
          const data: SessionStatusResponse = await response.json();

          if (data.status === 'completed' && data.result) {
            setResult(data.result);
            setViewState('result');
            if (intervalRef.current) clearInterval(intervalRef.current);
          } else if (data.status === 'expired' || data.status === 'not-found') {
            reset();
          }
        } catch (error) {
          console.error('輪詢錯誤:', error);
        }
      }, 2000);
    },
    [reset]
  );

  const generateQR = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/qr-session', { method: 'POST' });
      const data = await response.json();

      if (data.success) {
        setSession(data);
        setTimeLeft(300);
        setViewState('session');
        startPolling(data.sessionId);

        setDisplay(true);
      }
    } catch (error) {
      console.error('生成 QR 碼失敗:', error);
    }
  }, [startPolling]);

  const handleEditOrder = useCallback(() => {
    if (result) {
      const names = getImportNamesFromText(result.text);
      setCleanedNames(names);
      setViewState('editing');
    }
  }, [result]);

  const handleDirectConfirm = useCallback(() => {
    if (result) {
      const names = getImportNamesFromText(result.text);
      setFinalOrder(names);
      setViewState('final');
    }
  }, [result, setFinalOrder]);

  const handleConfirmOrder = useCallback(
    (orderedNames: string[]) => {
      setFinalOrder(orderedNames);
      setViewState('final');
    },
    [setFinalOrder]
  );

  const handleCancelEdit = useCallback(() => {
    setViewState('result');
  }, []);

  const handleSubmit = useCallback(() => {
    const confirmed = window.confirm('導入選手姓名會重置賽程表喔，確定嗎?');
    if (!confirmed) return;

    onImportNames(finalOrder);
    reset();
  }, [finalOrder, onImportNames, reset]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (session && viewState === 'session') {
      reset();
    }
  }, [timeLeft, session, viewState, reset]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const finalUI = useMemo(() => {
    if (viewState !== 'final') return null;

    return (
      <Card>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">✅ 最終名單順序</span>
            <span className="text-sm">共 {finalOrder.length} 人</span>
          </div>
        </div>

        <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
          {finalOrder.map((name, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 px-3 rounded mb-2 bg-foreground last:mb-0 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs bg-background px-2 py-1 rounded font-mono">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <span className={`text-sm text-background ${name ? 'font-bold' : ''}`}>{name ? name : '空籤'}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button text="🔄 重新開始" onClick={reset} className="flex-1" />
          <Button text="✏️ 重新排序" onClick={() => setViewState('editing')} className="flex-1" />
        </div>

        <div className="mt-3 pt-3 border-t">
          <Button text="📋 確定導入名單" onClick={handleSubmit} className="w-full text-sm bg-green-500" />
        </div>
      </Card>
    );
  }, [finalOrder, handleSubmit, reset, viewState]);

  const editingUI = useMemo(() => {
    if (viewState !== 'editing') return null;

    return (
      <Card>
        <div className="mb-4">
          <h3 className="font-medium">
            ✏️ 調整名單順序 (左到右{gamersCount}強{tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'})
          </h3>
          <p className="text-sm mt-1">拖拉下方的選手來調整比賽順序，或移除不需要的選手</p>
        </div>

        <TournamentSlotEditor
          gamersCount={gamersCount}
          initialTags={cleanedNames}
          onConfirm={handleConfirmOrder}
          onCancel={handleCancelEdit}
        />
      </Card>
    );
  }, [viewState, gamersCount, tournamentType, cleanedNames, handleConfirmOrder, handleCancelEdit]);

  const resultUI = useMemo(() => {
    if (viewState !== 'result') return null;
    if (!result) return null;

    const names = getImportNamesFromText(result.text);

    return (
      <Card>
        <div className="mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">🎯 識別結果</span>
            <span className="text-sm">準確度: {result.confidence.toFixed(1)}%</span>
          </div>
          <div className="text-sm">識別到 {names.length} 個名字</div>
        </div>

        <textarea
          disabled
          value={names.join('\n')}
          rows={12}
          className="bg-foreground border rounded p-3 max-h-40 mb-4 whitespace-pre-wrap text-sm text-background"
        />

        <div className="grid grid-cols-2 gap-2">
          <Button text="✅ 直接確認" onClick={handleDirectConfirm} />
          <Button text="✏️ 調整順序" onClick={handleEditOrder} />
        </div>

        <div className="mt-3 pt-3 border-t">
          <Button text="🔄 重新開始" onClick={reset} className="w-full text-sm" />
        </div>
      </Card>
    );
  }, [viewState, result, handleDirectConfirm, handleEditOrder, reset]);

  const sessionUI = useMemo(() => {
    if (viewState !== 'session') return null;
    if (!session) return null;

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return (
      <Card>
        <div className="text-center">
          <div className="mb-4">
            <h3 className="font-medium mb-2">📱 掃描 QR 碼上傳名單</h3>
            <p className="text-sm">用手機掃描下方 QR 碼來上傳名單圖片</p>
          </div>

          <div className="mb-4">
            <Link href={session.uploadUrl} target="_blank" title={`${process.env.NEXT_PUBLIC_SITENAME}名單導入QR code`}>
              <Image
                src={session.qrCodeDataUrl}
                alt={`${process.env.NEXT_PUBLIC_SITENAME}名單導入QR code`}
                width={150}
                height={150}
                className="mx-auto border rounded-lg shadow-sm"
                placeholder="blur"
                blurDataURL={session.qrCodeDataUrl}
              />
            </Link>
          </div>

          <div className="mb-4">
            <div className={`text-lg font-mono ${timeLeft < 60 ? 'text-red-500' : 'text-blue-600'}`}>
              ⏱️ {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
            </div>
            <div className="text-xs mt-1">{timeLeft < 60 ? '即將到期！' : '等待上傳中...'}</div>
          </div>

          <Button text="❌ 取消" onClick={reset} className="w-full" />
        </div>
      </Card>
    );
  }, [viewState, session, timeLeft, reset]);

  const content = useMemo(
    () => (
      <Popup title="新增球場賽程" display={display} onClose={() => setDisplay(false)}>
        {viewState === 'final' && finalUI && finalUI}
        {viewState === 'editing' && editingUI && editingUI}
        {viewState === 'result' && resultUI && resultUI}
        {viewState === 'session' && sessionUI && sessionUI}
      </Popup>
    ),
    [display, editingUI, finalUI, resultUI, sessionUI, viewState]
  );

  return (
    <>
      <Button text="從手機導入選手名單" onClick={generateQR} />
      {content}
    </>
  );
};

export default QRButton;
