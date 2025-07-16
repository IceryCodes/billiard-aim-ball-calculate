import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { TournamentType } from '@/domains/tournament';
import ManagerCourtProtected from '@/hooks/utils/protections/components/ManagerCourtProtected';

import FinalTournamentReactFlowInner from './FinalTournamentReactFlowInner';
import { TournamentDisplayProps } from './interfaces';
import { SingleEliminationReactFlowRef } from './reactFlowTypes';
import TournamentViewer from './TournamentViewer';

const ResponsiveTournamentDisplay: React.FC<TournamentDisplayProps> = ({
  tournamentData,
  onMatchUpdate,
  isEditMode = false,
  onGamerNameEdit,
  onGamerGamesEdit,
}) => {
  const router = useRouter();
  const { tournament, title } = tournamentData;
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [gamerEditMode, setGamerEditMode] = useState(false); // 新增：選手編輯模式
  const reactFlowRef = useRef<SingleEliminationReactFlowRef>(null);
  const validGamersCount = tournament.gamers.filter((gamer) => !!gamer.name).length;

  // 響應式檢測
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 全螢幕切換 - 修復關閉功能
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      reactFlowRef.current?.setFullscreenView();
    } else {
      setIsFullscreen(false);
      reactFlowRef.current?.setOptimalView();
    }
  }, [isFullscreen]);

  // 編輯賽程表
  const toggleEditTournament = useCallback(() => {
    router.push(
      `${getPageUrlByType(PageType.COURTS)}/${tournamentData.courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${tournamentData.customLink}/edit`
    );
  }, [router, tournamentData.courtCustomLink, tournamentData.customLink]);

  // 下載賽程表
  const handleDownload = useCallback(() => {
    reactFlowRef.current?.downloadImage(`${title}賽程表.png`);
  }, [title]);

  // 新增：切換選手編輯模式
  const toggleGamerEditMode = useCallback(() => {
    const newMode = !gamerEditMode;
    setGamerEditMode(newMode);
    // 通過 ref 通知 React Flow 組件編輯模式變更
    reactFlowRef.current?.setEditMode(newMode ? 'GAMER_EDIT' : 'NORMAL');
  }, [gamerEditMode]);

  // 修復：強制關閉全螢幕 - 增加事件處理和錯誤處理
  const closeFullscreen = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsFullscreen(false);
    reactFlowRef.current?.setOptimalView();
  }, []);

  // 新增：ESC 鍵關閉全螢幕
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        closeFullscreen();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      // 防止背景滾動
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen, closeFullscreen]);

  // 移動端最佳化顯示
  const handleMobileOptimize = useCallback(() => {
    if (isMobile) {
      setIsFullscreen(true);
      reactFlowRef.current?.setFullscreenView();
    }
  }, [isMobile]);

  return (
    <>
      <div className="w-full mx-auto">
        <div className={`${isEditMode ? 'bg-link' : 'bg-foreground'} rounded-lg shadow-md overflow-hidden`}>
          {/* 標題列 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-3 sm:px-6 pt-3 sm:pt-4 pb-2 gap-2 sm:gap-0">
            <div className="flex gap-x-2 items-center">
              <h2 className="text-base sm:text-lg font-semibold text-background">
                {`${tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表 (${validGamersCount}/${tournament.gamerCount}人)`}
              </h2>
            </div>

            {/* 控制按鈕 */}
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {isMobile ? (
                <button
                  onClick={handleMobileOptimize}
                  className="flex-1 sm:flex-none px-3 py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm text-white font-medium"
                  title="最佳化顯示"
                >
                  📱 最佳顯示
                </button>
              ) : (
                <>
                  {/* 新增：選手編輯模式按鈕 */}
                  {isEditMode && (
                    <button
                      onClick={toggleGamerEditMode}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        gamerEditMode
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                      }`}
                      title={gamerEditMode ? '結束編輯選手' : '編輯選手'}
                    >
                      {gamerEditMode ? '✓ 完成編輯' : '✏️ 編輯選手'}
                    </button>
                  )}

                  <button
                    onClick={handleDownload}
                    className="px-3 py-1 bg-green-100 hover:bg-green-200 rounded text-xs text-green-600"
                    title="下載賽程表"
                  >
                    📥 下載
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs text-blue-600"
                    title="全螢幕顯示"
                  >
                    🔍 全螢幕
                  </button>
                  {!isEditMode && (
                    <ManagerCourtProtected pageId={tournamentData.customLink}>
                      <button
                        onClick={toggleEditTournament}
                        className="px-3 py-1 bg-orange-100 hover:bg-orange-200 rounded text-xs text-orange-600"
                        title="編輯"
                      >
                        編輯賽程表
                      </button>
                    </ManagerCourtProtected>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 賽程表內容 */}
          <div
            className={`${isMobile && !isFullscreen ? 'h-64 sm:h-auto' : 'h-96 sm:h-[500px] lg:h-[600px]'} overflow-hidden`}
          >
            {tournament.tournamentType === TournamentType.SINGLE && (
              <>
                {isEditMode ? (
                  <FinalTournamentReactFlowInner
                    ref={reactFlowRef}
                    gamers={tournament.gamers}
                    matches={tournament.matches}
                    tournamentTitle={title}
                    onMatchUpdate={onMatchUpdate}
                    isEditMode={isEditMode}
                    editMode={gamerEditMode ? 'GAMER_EDIT' : 'NORMAL'}
                    onGamerNameEdit={onGamerNameEdit}
                    onGamerGamesEdit={onGamerGamesEdit}
                  />
                ) : (
                  <TournamentViewer
                    ref={reactFlowRef}
                    gamers={tournament.gamers}
                    matches={tournament.matches}
                    tournamentTitle={title}
                  />
                )}
              </>
            )}

            {tournament.tournamentType === TournamentType.DOUBLE && (
              <div className="text-center text-gray-500 py-8 text-sm sm:text-base">雙敗淘汰賽程表功能開發中...</div>
            )}
          </div>

          {/* 移動端提示 */}
          {isMobile && !isFullscreen && (
            <div className="px-3 py-2 bg-blue-50 border-t text-center">
              <p className="text-xs text-blue-600">👆 點擊「最佳顯示」以獲得更好的瀏覽體驗</p>
            </div>
          )}

          {/* 編輯模式提示 */}
          {isEditMode && gamerEditMode && (
            <div className="px-3 py-2 bg-yellow-50 border-t text-center">
              <p className="text-xs text-yellow-700">✏️ 選手編輯模式：雙擊選手框或遊戲局數進行編輯</p>
            </div>
          )}
        </div>
      </div>

      {/* 修復：全螢幕模式 - 增加 z-index 和更好的事件處理 */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex flex-col z-[9999]"
          style={{ zIndex: 9999 }} // 確保在最上層
        >
          {/* 全螢幕標題列 */}
          <div
            className={`${isEditMode ? 'bg-link' : 'bg-foreground'} border-b px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center relative z-[10000]`}
          >
            <div className="flex gap-x-2 items-center">
              <h3 className="text-sm sm:text-lg font-semibold text-gray-800 truncate mr-2">
                {isMobile
                  ? title
                  : `${title} - ${tournament.tournamentType === TournamentType.SINGLE ? '單敗淘汰' : '雙敗淘汰'}賽程表`}
              </h3>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {!isMobile && (
                <>
                  {/* 全螢幕模式下的編輯按鈕 */}
                  {isEditMode && (
                    <button
                      onClick={toggleGamerEditMode}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        gamerEditMode
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700'
                      }`}
                      title={gamerEditMode ? '結束編輯選手' : '編輯選手'}
                    >
                      {gamerEditMode ? '✓ 完成編輯' : '✏️ 編輯選手'}
                    </button>
                  )}
                </>
              )}

              {/* 修復：增強關閉按鈕 */}
              <button
                onClick={closeFullscreen}
                onMouseDown={(e) => e.stopPropagation()} // 防止事件被阻擋
                className="px-3 sm:px-4 py-1 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded text-xs sm:text-sm font-medium shadow-lg transition-colors z-[10001]"
                title="關閉全螢幕 (ESC)"
                style={{ position: 'relative', zIndex: 10001 }}
              >
                ✕ 關閉
              </button>
            </div>
          </div>

          {/* 全螢幕內容 */}
          <div className="flex-1 flex justify-center items-center overflow-auto bg-white">
            {tournament.tournamentType === TournamentType.SINGLE && (
              <>
                {isEditMode ? (
                  <FinalTournamentReactFlowInner
                    ref={reactFlowRef}
                    gamers={tournament.gamers}
                    matches={tournament.matches}
                    tournamentTitle={title}
                    onMatchUpdate={onMatchUpdate}
                    isEditMode={isEditMode}
                    editMode={gamerEditMode ? 'GAMER_EDIT' : 'NORMAL'}
                    onGamerNameEdit={onGamerNameEdit}
                    onGamerGamesEdit={onGamerGamesEdit}
                  />
                ) : (
                  <TournamentViewer
                    ref={reactFlowRef}
                    gamers={tournament.gamers}
                    matches={tournament.matches}
                    tournamentTitle={title}
                  />
                )}
              </>
            )}
          </div>

          {/* 移動端提示 */}
          {isMobile && (
            <div className="bg-gray-800 text-white px-3 py-2 text-center">
              <p className="text-xs">💡 拖曳移動來瀏覽賽程表 • 按 ESC 退出全螢幕</p>
            </div>
          )}

          {/* 全螢幕編輯模式提示 */}
          {isEditMode && gamerEditMode && (
            <div className="bg-yellow-800 text-yellow-100 px-3 py-2 text-center">
              <p className="text-xs">✏️ 選手編輯模式：雙擊選手框或遊戲局數進行編輯</p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ResponsiveTournamentDisplay;
