import { ReactElement, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { Group, Image as KonvaImage, Rect } from 'react-konva';
import useImage from 'use-image';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { BroadcastTestType, ToastType, TournamentType } from '@/domains/tournament';
import { composeStatusDisplay } from '@/features/tournaments/helper';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import DeleteTournamentContent from '@/global-components/buttons/DeleteTournamentButton';
import { TournamentFormButton, TournamentFormMode } from '@/global-components/buttons/TournamentFormButton';
import Card from '@/global-components/Card';
import Popup from '@/global-components/Popup';
import ManagerCourtProtected from '@/hooks/utils/protections/components/ManagerCourtProtected';

import { DrawingMode, EditMode } from '../../edit/components/constants';
import {
  ConnectionQualityType,
  ResponsiveWarningProps,
  TournamentControlsProps,
  TournamentDisplayProps,
  TournamentStatusBarProps,
  TournamentToastProps,
} from '../../edit/components/interfaces';
import SingleEliminationKonva, { SingleEliminationKonvaRef } from '../../edit/components/SingleEliminationKonva';

// QR Code Image Hook
const useQRCodeImage = (url: string, size = 100) => {
  const [qrDataURL, setQrDataURL] = useState<string>('');

  useEffect(() => {
    if (!url) return;

    const generateQR = async () => {
      try {
        const dataURL = await QRCode.toDataURL(url, {
          width: size,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
          errorCorrectionLevel: 'M',
        });
        setQrDataURL(dataURL);
      } catch (error) {
        console.error('QR Code generation failed:', error);
        setQrDataURL('');
      }
    };

    generateQR();
  }, [url, size]);

  const [image] = useImage(qrDataURL, 'anonymous');
  return image;
};

export const QRCodeCanvas = ({ x, y, size = 80 }: { x: number; y: number; size?: number }) => {
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href.replaceAll('/edit', ''));
    }
  }, []);

  const qrImage = useQRCodeImage(currentUrl, size);

  if (!qrImage || !currentUrl) return <></>;

  return (
    <Group x={x - size / 2} y={y}>
      <Rect
        width={size + 4}
        height={size + 4}
        x={-2}
        y={-2}
        fill="white"
        stroke="#d1d5db"
        strokeWidth={1}
        cornerRadius={6}
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.1}
        shadowOffset={{ x: 0, y: 2 }}
      />
      <KonvaImage image={qrImage} width={size} height={size} cornerRadius={4} />
    </Group>
  );
};

export const TournamentStatusBar = ({
  isConnected,
  onlineCount,
  lastUpdateTime,
  isEditMode = false,
  tournament,
  reconnect,
  refetch,
  connectionQuality = ConnectionQualityType.DISCONNECTED,
}: TournamentStatusBarProps): ReactElement => {
  const router = useRouter();

  const statusDisplay = composeStatusDisplay({ isConnected, connectionQuality, isEditMode });

  const redirectToCourt = useCallback(() => {
    router.push(`${getPageUrlByType(PageType.COURTS)}/${tournament.courtCustomLink}`);
  }, [router, tournament.courtCustomLink]);

  return (
    <Card className="w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between gap-x-4">
          <div>
            <div className="flex flex-row items-center gap-x-2">
              <h1 className="text-2xl font-bold">{tournament.title}</h1>
              <ManagerCourtProtected pageId={tournament.customLink}>
                <TournamentFormButton mode={TournamentFormMode.Edit} tournament={tournament} onSuccess={refetch} />
                <DeleteTournamentContent
                  _id={tournament._id}
                  tournamentTitle={tournament.title}
                  onSuccess={redirectToCourt}
                />
              </ManagerCourtProtected>
            </div>

            <div className="space-x-2">
              <span>撞球場地:</span>
              <span className="truncate hover:text-link cursor-pointer" onClick={redirectToCourt}>
                {tournament.courtTitle}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${statusDisplay.dotColor}`}></div>
                <span className={`${statusDisplay.color} font-medium`}>{statusDisplay.text}</span>

                {/* 連線品質指示器 */}
                {isConnected && connectionQuality === 'poor' && (
                  <span className="text-yellow-600 text-xs bg-yellow-100 px-2 py-1 rounded">連線不穩</span>
                )}

                {!isConnected && reconnect && (
                  <button
                    onClick={reconnect}
                    className="text-blue-600 hover:text-blue-800 underline text-xs bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                  >
                    重新連線
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4 items-center">
                {onlineCount > 0 && (
                  <span>👁️ {isEditMode ? `${onlineCount} 人正在觀看您的編輯` : `${onlineCount} 人在線`}</span>
                )}
              </div>
            </div>
            <span>最後更新: {lastUpdateTime}</span>
          </div>
        </div>

        {!!tournament.excerpt && (
          <blockquote className="border-l-4 border-link pl-4 italic">
            {<TournamentContentFormatter content={tournament.excerpt} />}
          </blockquote>
        )}

        {!!tournament.content && <section>{<TournamentContentFormatter content={tournament.content} />}</section>}
      </div>
    </Card>
  );
};

export const TournamentToast = ({ toast }: TournamentToastProps): ReactElement | null => {
  if (!toast) return null;

  const bgColorMap: Record<ToastType, string> = {
    [ToastType.SUCCESS]: 'bg-green-500',
    [ToastType.WARNING]: 'bg-yellow-500',
    [ToastType.ERROR]: 'bg-red-500',
    [ToastType.ANNOUNCEMENT]: 'bg-purple-500',
    [ToastType.INFO]: 'bg-blue-500',
  };

  const bgColor = bgColorMap[toast.type] || 'bg-blue-500';

  return (
    <div
      className={`fixed top-4 right-2 sm:right-4 z-50 px-3 sm:px-4 py-2 rounded-lg shadow-lg text-white ${bgColor} max-w-xs sm:max-w-sm text-sm`}
    >
      {toast.message}
    </div>
  );
};

export const TournamentDisplay = ({
  tournamentData,
  onMatchUpdate,
  isEditMode = false,
  drawingData,
  onDrawingUpdate,
  onPlayerNameEdit,
  onPlayerGamesEdit,
}: TournamentDisplayProps): ReactElement => {
  const router = useRouter();

  const { tournament, courtTitle, title } = tournamentData;
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(DrawingMode.NORMAL);
  const [editMode, setEditMode] = useState<EditMode>(EditMode.NORMAL);
  const konvaRef = useRef<SingleEliminationKonvaRef>(null);

  const validPlayersCount = useMemo(() => {
    return tournament.players.filter((player) => !!player.name).length;
  }, [tournament.players]);

  const toggleEditMode = useCallback(() => {
    const newMode = editMode === EditMode.NORMAL ? EditMode.PLAYER_EDIT : EditMode.NORMAL;
    setEditMode(newMode);
    konvaRef.current?.setEditMode(newMode);
  }, [editMode]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      setTimeout(() => {
        konvaRef.current?.setFullscreenView();
      }, 100);
    } else {
      setIsFullscreen(false);
      setTimeout(() => {
        konvaRef.current?.setOptimalView();
      }, 100);
    }
  }, [isFullscreen]);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
    setTimeout(() => {
      konvaRef.current?.setOptimalView();
    }, 100);
  }, []);

  const handleZoomIn = useCallback(() => {
    konvaRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    konvaRef.current?.zoomOut();
  }, []);

  const toggleDrawingMode = useCallback(() => {
    const newMode = drawingMode === DrawingMode.NORMAL ? DrawingMode.DRAWING : DrawingMode.NORMAL;
    setDrawingMode(newMode);
    konvaRef.current?.setDrawingMode(newMode);
  }, [drawingMode]);

  const handleClearDrawing = useCallback(() => {
    konvaRef.current?.clearDrawing();
  }, []);

  const handleMobileView = useCallback(() => {
    if (isMobile) {
      setIsFullscreen(true);
      setTimeout(() => {
        konvaRef.current?.setFullscreenView();
      }, 100);
    }
  }, [isMobile]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      <div className="w-full mx-auto">
        <div className={`${isEditMode ? 'bg-link' : 'bg-foreground'} rounded-lg shadow-md overflow-hidden`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 sm:px-6 pt-3 sm:pt-4 pb-2 gap-2 sm:gap-0">
            <div className="flex gap-x-2 items-center">
              <h3 className="text-base sm:text-lg font-semibold text-background">
                {`${tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表 (${validPlayersCount}/${tournament.playerCount}人)`}
              </h3>
              {!isEditMode && (
                <ManagerCourtProtected pageId={tournamentData.courtCustomLink}>
                  <Button
                    onClick={() =>
                      router.push(
                        `${getPageUrlByType(PageType.COURTS)}/${tournamentData.courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${tournamentData.customLink}/edit`
                      )
                    }
                    element={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-6 h-6 cursor-pointer hover:text-link transition text-background"
                      >
                        <path d="M3 17.25V21h3.75l11.39-11.39-3.75-3.75L3 17.25zM16 3l5 5-2 2-5-5 2-2z" />
                      </svg>
                    }
                  />
                </ManagerCourtProtected>
              )}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {isMobile ? (
                <button
                  onClick={handleMobileView}
                  className="flex-1 sm:flex-none px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm text-white font-medium"
                  title="最佳化顯示"
                >
                  📱 最佳顯示
                </button>
              ) : (
                <>
                  <button
                    onClick={handleZoomOut}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600 font-bold"
                    title="縮小"
                  >
                    −
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600 font-bold"
                    title="放大"
                  >
                    +
                  </button>

                  {isEditMode && (
                    <>
                      <button
                        onClick={toggleEditMode}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          editMode === EditMode.PLAYER_EDIT
                            ? 'bg-blue-100 hover:bg-blue-200 text-blue-600'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }`}
                        title={editMode === EditMode.PLAYER_EDIT ? '完成編輯' : '編輯選手'}
                        disabled={drawingMode === DrawingMode.DRAWING}
                      >
                        {editMode === EditMode.PLAYER_EDIT ? '✅ 完成' : '✏️ 編輯選手'}
                      </button>

                      <button
                        onClick={toggleDrawingMode}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          drawingMode === DrawingMode.DRAWING
                            ? 'bg-red-100 hover:bg-red-200 text-red-600'
                            : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                        }`}
                        title={drawingMode === DrawingMode.DRAWING ? '結束繪圖' : '開始繪圖'}
                      >
                        {drawingMode === DrawingMode.DRAWING ? '✏️ 結束' : '✏️ 繪圖'}
                      </button>

                      <button
                        onClick={handleClearDrawing}
                        className="px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded text-xs text-purple-600 font-medium"
                        title="清除繪圖"
                      >
                        🗑️ 清除
                      </button>
                    </>
                  )}

                  <button
                    onClick={toggleFullscreen}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs text-blue-600"
                    title="全螢幕顯示"
                  >
                    🔍 全螢幕
                  </button>
                </>
              )}
            </div>
          </div>

          <div
            className={`${isMobile && !isFullscreen ? 'h-64 sm:h-auto' : 'h-96 sm:h-[500px] lg:h-[600px]'} overflow-hidden`}
          >
            {tournament.tournamentType === TournamentType.SINGLE && (
              <SingleEliminationKonva
                ref={konvaRef}
                players={tournament.players}
                matches={tournament.matches}
                onMatchUpdate={isEditMode ? onMatchUpdate : undefined}
                isEditMode={isEditMode}
                drawingData={drawingData}
                onDrawingUpdate={onDrawingUpdate}
                editMode={editMode}
                onPlayerNameEdit={onPlayerNameEdit}
                onPlayerGamesEdit={onPlayerGamesEdit}
              />
            )}

            {tournament.tournamentType === TournamentType.DOUBLE && (
              <div className="text-center text-gray-500 py-8 text-sm sm:text-base">雙敗淘汰賽程表功能開發中...</div>
            )}
          </div>

          {isMobile && !isFullscreen && (
            <div className="px-3 py-2 bg-blue-50 border-t text-center">
              <p className="text-xs text-blue-600">👆 點擊「最佳顯示」以獲得更好的瀏覽體驗</p>
            </div>
          )}
        </div>
      </div>

      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          <div
            className={`${isEditMode ? 'bg-link' : 'bg-foreground'} border-b px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center`}
          >
            <div className="flex gap-x-2 items-center">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800 truncate mr-2">
                {isMobile
                  ? `${title}`
                  : `${courtTitle} ${title} ${tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表 (${validPlayersCount}/${tournament.playerCount}人)`}
              </h3>
              .........
              {!isEditMode && (
                <ManagerCourtProtected pageId={tournamentData.courtCustomLink}>
                  <Button
                    onClick={() =>
                      router.push(
                        `${getPageUrlByType(PageType.COURTS)}/${tournamentData.courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${tournamentData.customLink}/edit`
                      )
                    }
                    element={
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="w-6 h-6 cursor-pointer hover:text-link transition text-background"
                      >
                        <path d="M3 17.25V21h3.75l11.39-11.39-3.75-3.75L3 17.25zM16 3l5 5-2 2-5-5 2-2z" />
                      </svg>
                    }
                  />
                </ManagerCourtProtected>
              )}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {!isMobile && (
                <>
                  <button
                    onClick={handleZoomOut}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-600 font-bold"
                    title="縮小"
                  >
                    −
                  </button>
                  <button
                    onClick={handleZoomIn}
                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm text-gray-600 font-bold"
                    title="放大"
                  >
                    +
                  </button>

                  {isEditMode && (
                    <>
                      <button
                        onClick={toggleDrawingMode}
                        className={`px-2 py-1 rounded text-sm font-medium ${
                          drawingMode === DrawingMode.DRAWING
                            ? 'bg-red-100 hover:bg-red-200 text-red-600'
                            : 'bg-orange-100 hover:bg-orange-200 text-orange-600'
                        }`}
                        title={drawingMode === DrawingMode.DRAWING ? '結束繪圖' : '開始繪圖'}
                      >
                        {drawingMode === DrawingMode.DRAWING ? '✏️ 結束' : '✏️ 繪圖'}
                      </button>

                      <button
                        onClick={handleClearDrawing}
                        className="px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded text-sm text-purple-600 font-medium"
                        title="清除繪圖"
                      >
                        🗑️ 清除
                      </button>
                    </>
                  )}
                </>
              )}

              <button
                onClick={closeFullscreen}
                className="px-3 sm:px-4 py-1 sm:py-2 bg-red-100 hover:bg-red-200 rounded text-xs sm:text-sm text-red-600 whitespace-nowrap"
                title="關閉全螢幕"
              >
                ✕ 關閉
              </button>
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center overflow-auto bg-white">
            {tournament.tournamentType === TournamentType.SINGLE && (
              <SingleEliminationKonva
                ref={konvaRef}
                players={tournament.players}
                matches={tournament.matches}
                onMatchUpdate={isEditMode ? onMatchUpdate : undefined}
                isEditMode={isEditMode}
                drawingData={drawingData}
                onDrawingUpdate={onDrawingUpdate}
              />
            )}

            {tournament.tournamentType === TournamentType.DOUBLE && (
              <div className="text-center text-gray-500 py-8 text-sm sm:text-base">雙敗淘汰賽程表功能開發中...</div>
            )}
          </div>

          {isMobile && (
            <div className="bg-gray-800 text-white px-3 py-2 text-center">
              <p className="text-xs">💡 拖曳移動來瀏覽賽程表</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export const ResponsiveWarning = ({ windowWidth }: ResponsiveWarningProps): ReactElement | null => {
  if (windowWidth > 360) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 mb-4 mx-2 sm:mx-0">
      <div className="flex">
        <div className="ml-2">
          <p className="text-xs sm:text-sm text-yellow-700">建議將手機旋轉至橫向模式或使用平板/電腦以獲得最佳體驗</p>
        </div>
      </div>
    </div>
  );
};

const Tips = (): ReactElement => (
  <section className="min-w-80 flex flex-col gap-y-4">
    <p>在參賽選手區塊連點選手名稱可編輯</p>
    <p>在賽程表區塊點擊比賽框中的選手選擇獲勝者</p>
    <p>點擊「✏️ 繪圖」按鈕開始繪畫，再次點擊結束繪畫模式</p>
    <p>使用「🗑️ 清除」按鈕可以清除所有繪圖內容</p>
    <p className="text-blue-600">💡 所有編輯和繪圖都會即時同步給觀看者</p>
  </section>
);

export const TournamentControls = ({
  isConnected,
  onlineCount,
  onTestBroadcast,
  connectionQuality,
}: TournamentControlsProps): ReactElement => {
  const [showTips, setShowTips] = useState<boolean>(false);

  const statusDisplay = useMemo(
    () => composeStatusDisplay({ isConnected, connectionQuality, isEditMode: true }),
    [connectionQuality, isConnected]
  );

  return (
    <div className="w-full mx-auto px-2 sm:px-0">
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mt-4 sm:mt-6">
        <div className="flex gap-x-2 items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-background">即時廣播控制</h3>
          <Button onClick={() => setShowTips(true)} text="說明" buttonStyle={ButtonStyleType.Active} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">連線狀態</div>
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${statusDisplay.dotColor}`}></div>
              <span className={`${statusDisplay.color} font-medium`}>{statusDisplay.text}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">觀看人數</div>
            <div className="text-blue-600 font-medium text-sm">👁️ {onlineCount} 人正在觀看</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onTestBroadcast(BroadcastTestType.ANNOUNCEMENT)}
            className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
            disabled={!isConnected}
          >
            📢 發送測試公告
          </button>

          <button
            onClick={() => onTestBroadcast(BroadcastTestType.TEST_UPDATE)}
            className="w-full px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
            disabled={!isConnected}
          >
            🧪 發送測試更新
          </button>

          <button
            onClick={() => onTestBroadcast(BroadcastTestType.REFRESH_REQUEST)}
            className="w-full px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 text-sm"
            disabled={!isConnected}
          >
            🔄 要求觀看者重新載入
          </button>
        </div>

        {!isConnected && <p className="text-red-600 text-xs sm:text-sm mt-2">⚠️ 即時廣播未連線，編輯不會即時同步</p>}
      </div>

      <Popup title={`${PageType.TOURNAMENTS}說明`} display={showTips} onClose={() => setShowTips(false)}>
        <Tips />
      </Popup>
    </div>
  );
};

export const TournamentContentFormatter = ({ content }: { content: string }): ReactElement => {
  const formatContent = (text: string): ReactElement[] => {
    return text.split('\n').map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  return <div className="whitespace-pre-wrap leading-relaxed text-gray-800">{formatContent(content)}</div>;
};
