import { ReactElement, useCallback, useState } from 'react';

import { BroadcastTestType, Player, PlayerCount, ToastType, TournamentType } from '@/domains/tournament';
import { Button, ButtonStyleType } from '@/global-components/buttons/Button';

import EditablePlayer from '../../edit/components/EditablePlayer';
import {
  ResponsiveWarningProps,
  TournamentControlsProps,
  TournamentDisplayProps,
  TournamentStatusBarProps,
  TournamentToastProps,
} from '../../edit/components/interfaces';
import SingleEliminationKonva from '../../edit/components/SingleEliminationKonva';

export const TournamentStatusBar = ({
  isConnected,
  onlineCount,
  lastUpdateTime,
  isEditMode = false,
  tournamentTitle,
  reconnect,
}: TournamentStatusBarProps): ReactElement => {
  const bgColor = isEditMode ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200';
  const statusText = isEditMode
    ? `編輯模式 - ${isConnected ? '即時廣播已啟用' : '即時廣播已斷開'}`
    : `${isConnected ? '🔄' : '❌'} 即時更新`;

  return (
    <div className={`w-full ${bgColor} border-b px-4 py-2 mb-4`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={isEditMode ? 'text-gray-700 font-medium' : 'text-gray-600'}>{statusText}</span>
            {!isConnected && reconnect && (
              <button onClick={reconnect} className="text-blue-600 hover:text-blue-800 underline text-xs">
                重新連線
              </button>
            )}
          </div>

          {onlineCount > 0 && (
            <div className="flex items-center space-x-1">
              <span className="text-gray-400">👁️</span>
              <span className={isEditMode ? 'text-blue-700' : 'text-gray-600'}>
                {isEditMode ? `${onlineCount} 人正在觀看您的編輯` : `${onlineCount} 人在線`}
              </span>
            </div>
          )}

          {lastUpdateTime && !isEditMode && <div className="text-gray-400">最後更新: {lastUpdateTime}</div>}
        </div>

        {isEditMode && tournamentTitle && <div className="text-gray-600">賽程: {tournamentTitle}</div>}
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
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${bgColor}`}>{toast.message}</div>
  );
};

export const TournamentDisplay = ({
  tournamentData,
  onMatchUpdate,
  isEditMode = false,
}: TournamentDisplayProps): ReactElement => {
  const { tournament, courtTitle, title } = tournamentData;

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const closeFullscreen = useCallback(() => {
    setIsFullscreen(false);
  }, []);

  return (
    <>
      <div className="w-full mx-auto">
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center px-6 pt-4 pb-2">
            <h3 className="text-lg font-semibold text-center text-background flex-1">
              {tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表
            </h3>

            {/* 控制按鈕 */}
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs text-blue-600"
                title="全螢幕顯示"
              >
                🔍 全螢幕
              </button>
            </div>
          </div>

          {tournament.tournamentType === TournamentType.SINGLE && (
            <SingleEliminationKonva
              players={tournament.players}
              matches={tournament.matches}
              onMatchUpdate={isEditMode ? onMatchUpdate : undefined}
            />
          )}

          {tournament.tournamentType === TournamentType.DOUBLE && (
            <div className="text-center text-gray-500 py-8">雙敗淘汰賽程表功能開發中...</div>
          )}
        </div>
      </div>

      {/* 全螢幕模式 */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
          {/* 全螢幕控制欄 */}
          <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">
              {`${courtTitle} ${title} ${tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表`}
            </h3>

            <div className="flex items-center space-x-3">
              <button
                onClick={closeFullscreen}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-sm text-red-600"
                title="關閉全螢幕"
              >
                ✕ 關閉
              </button>
            </div>
          </div>

          {/* 全螢幕賽程表內容 */}
          <div className="flex-1 flex justify-center items-center overflow-auto bg-white">
            {tournament.tournamentType === TournamentType.SINGLE && (
              <SingleEliminationKonva
                players={tournament.players}
                matches={tournament.matches}
                onMatchUpdate={isEditMode ? onMatchUpdate : undefined}
              />
            )}

            {tournament.tournamentType === TournamentType.DOUBLE && (
              <div className="text-center text-gray-500 py-8">雙敗淘汰賽程表功能開發中...</div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export const ResponsiveWarning = ({ windowWidth }: ResponsiveWarningProps): ReactElement | null => {
  if (windowWidth > 400) return null;

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4">
      <div className="flex">
        <div className="ml-3">
          <p className="text-sm text-yellow-700">建議使用較大的螢幕或將手機旋轉至橫向模式以獲得最佳體驗</p>
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
    <div className="max-w-full mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-background">賽程類型</h3>
            <div className="flex space-x-4">
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
            <h3 className="text-lg font-semibold mb-4 text-background">參賽人數</h3>
            <div className="flex flex-wrap gap-2">
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

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-background">參賽選手 ({tournament.players.length} 人)</h3>
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, 120px)' }}>
          {tournament.players.map((player: Player) => (
            <EditablePlayer key={player.id} player={player} onNameChange={onPlayerNameChange} onDragStart={onDragStart} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4 text-background">即時廣播控制</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600 mb-1">連線狀態</div>
            <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium text-background">{isConnected ? '✅ 已連線' : '❌ 未連線'}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600 mb-1">觀看人數</div>
            <div className="text-blue-600 font-medium">👁️ {onlineCount} 人正在觀看</div>
          </div>
        </div>

        <div className="flex gap-x-2">
          <button
            onClick={() => onTestBroadcast(BroadcastTestType.ANNOUNCEMENT)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            disabled={!isConnected}
          >
            📢 發送測試公告
          </button>

          <button
            onClick={() => onTestBroadcast(BroadcastTestType.TEST_UPDATE)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={!isConnected}
          >
            🧪 發送測試更新
          </button>

          <button
            onClick={() => onTestBroadcast(BroadcastTestType.REFRESH_REQUEST)}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            disabled={!isConnected}
          >
            🔄 要求觀看者重新載入
          </button>
        </div>

        {!isConnected && <p className="text-red-600 text-sm mt-2">⚠️ 即時廣播未連線，編輯不會即時同步</p>}
      </div>
    </div>
  );
};
