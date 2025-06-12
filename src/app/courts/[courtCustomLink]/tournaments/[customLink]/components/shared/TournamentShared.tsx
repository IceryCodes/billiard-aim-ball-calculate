import { ReactElement, useCallback, useEffect, useRef, useState } from 'react';

import { Group, Image as KonvaImage, Rect } from 'react-konva';
import useImage from 'use-image';

import { BroadcastTestType, Player, PlayerCount, ToastType, TournamentType } from '@/domains/tournament';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';

import { DrawingMode } from '../../edit/components/constants';
import EditablePlayer from '../../edit/components/EditablePlayer';
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
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;
  const [image] = useImage(qrCodeUrl, 'anonymous');
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
  tournamentTitle,
  reconnect,
  connectionQuality = ConnectionQualityType.DISCONNECTED,
}: TournamentStatusBarProps): ReactElement => {
  const bgColor = isEditMode ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';

  const getStatusDisplay = () => {
    if (!isConnected) {
      return {
        icon: '❌',
        text: isEditMode ? '即時廣播已斷開' : '即時更新已斷開',
        color: 'text-red-600',
        dotColor: 'bg-red-500',
      };
    }

    if (connectionQuality === 'poor') {
      return {
        icon: '⚠️',
        text: isEditMode ? '即時廣播連線不穩' : '即時更新連線不穩',
        color: 'text-yellow-600',
        dotColor: 'bg-yellow-500',
      };
    }

    return {
      icon: '🔄',
      text: isEditMode ? '即時廣播已啟用' : '即時更新已啟用',
      color: isEditMode ? 'text-blue-700' : 'text-green-600',
      dotColor: 'bg-green-500',
    };
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className={`w-full ${bgColor} border-b px-2 sm:px-4 py-2 mb-2 sm:mb-4`}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs sm:text-sm gap-2 sm:gap-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
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

          <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-4">
            {onlineCount > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-gray-400">👁️</span>
                <span className={isEditMode ? 'text-blue-700' : 'text-gray-600'}>
                  {isEditMode ? `${onlineCount} 人正在觀看您的編輯` : `${onlineCount} 人在線`}
                </span>
              </div>
            )}

            {lastUpdateTime && !isEditMode && <div className="text-gray-400 text-xs">最後更新: {lastUpdateTime}</div>}
          </div>
        </div>

        {isEditMode && tournamentTitle && (
          <div className="text-gray-600 text-xs sm:text-sm truncate max-w-full sm:max-w-none">賽程: {tournamentTitle}</div>
        )}
      </div>
    </div>
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
}: TournamentDisplayProps): ReactElement => {
  const { tournament, courtTitle, title } = tournamentData;
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(DrawingMode.NORMAL);
  const konvaRef = useRef<SingleEliminationKonvaRef>(null);

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
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 sm:px-6 pt-3 sm:pt-4 pb-2 gap-2 sm:gap-0">
            <h3 className="text-base sm:text-lg font-semibold text-background">
              {tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表
            </h3>

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
          <div className="bg-white border-b px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-800 truncate mr-2">
              {isMobile
                ? `${title}`
                : `${courtTitle} ${title} ${tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表`}
            </h3>

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

export const TournamentControls = ({
  tournament,
  isConnected,
  onlineCount,
  onPlayerCountChange,
  onTournamentTypeChange,
  onPlayerNameChange,
  onDragStart,
  onTestBroadcast,
}: TournamentControlsProps): ReactElement => {
  return (
    <div className="w-full mx-auto px-2 sm:px-0">
      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 gap-6 sm:gap-8">
          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-background">賽程類型</h3>
            <div className="flex space-x-2 sm:space-x-4">
              <Button
                onClick={() => onTournamentTypeChange(TournamentType.SINGLE)}
                text="單敗淘汰"
                buttonStyle={
                  tournament.tournamentType === TournamentType.SINGLE ? ButtonStyleType.Active : ButtonStyleType.Disabled
                }
              />
              <Button
                onClick={() => onTournamentTypeChange(TournamentType.DOUBLE)}
                text="雙敗淘汰"
                buttonStyle={
                  tournament.tournamentType === TournamentType.DOUBLE ? ButtonStyleType.Active : ButtonStyleType.Disabled
                }
              />
            </div>
          </div>

          <div>
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-background">參賽人數</h3>
            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2">
              {Object.values(PlayerCount)
                .filter((value) => typeof value === 'number')
                .map((count) => (
                  <Button
                    key={count}
                    onClick={() => onPlayerCountChange(count as PlayerCount)}
                    text={count.toString()}
                    buttonStyle={tournament.playerCount === count ? ButtonStyleType.Active : ButtonStyleType.Disabled}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-background">
          參賽選手 ({tournament.players.length} 人)
        </h3>
        <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {tournament.players.map((player: Player) => (
            <EditablePlayer key={player.id} player={player} onNameChange={onPlayerNameChange} onDragStart={onDragStart} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mt-4 sm:mt-6">
        <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-background">即時廣播控制</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-xs sm:text-sm text-gray-600 mb-1">連線狀態</div>
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium text-background text-sm">{isConnected ? '✅ 已連線' : '❌ 未連線'}</span>
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
