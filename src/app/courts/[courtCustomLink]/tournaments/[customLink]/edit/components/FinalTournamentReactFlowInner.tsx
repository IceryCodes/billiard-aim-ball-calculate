import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { Gamer } from '@/domains/tournament';
import { downloadImage } from '@/features/tournaments/helper';

import { createTournamentEdges, matchesToNodes } from './dataTransformers';
import { optimizedNodeTypes } from './nodes/optimizedNodeTypes';
import { viewOnlyNodeTypes } from './nodes/viewOnlyNodeTypes';
import { VIEWPORT_CONFIG } from './reactFlowConstants';
import {
  SingleEliminationReactFlowProps,
  SingleEliminationReactFlowRef,
  TournamentEdge,
  TournamentNode,
} from './reactFlowTypes';
import { validateEdges } from './reactFlowUtils';

// 簡化的配置（移除繪圖相關）
const createFlowConfig = (isEditMode: boolean, editMode: string) => ({
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: true, // 改為 true 讓節點可以接收事件
  panOnDrag: true,
  zoomOnScroll: editMode !== 'GAMER_EDIT', // 只在非編輯選手模式下允許滾輪縮放
  zoomOnDoubleClick: !isEditMode,
  panOnScroll: false,
  preventScrolling: true, // 改為 true 讓 React Flow 接管滾輪事件
  minZoom: 0.1,
  maxZoom: isEditMode ? 3 : 2,
  defaultEdgeOptions: {
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#f97316',
      strokeWidth: 4,
    },
    markerEnd: undefined, // 確保沒有箭頭
  },
});

// 內部組件（移除繪圖功能）
const FinalTournamentReactFlowInner = forwardRef<SingleEliminationReactFlowRef, SingleEliminationReactFlowProps>(
  (
    {
      gamers,
      matches,
      tournamentTitle,
      isEditMode = false,
      onMatchUpdate,
      editMode = 'NORMAL',
      onGamerNameEdit,
      onGamerGamesEdit,
    },
    ref
  ) => {
    const reactFlowInstance = useReactFlow();
    const [currentEditMode, setCurrentEditMode] = useState<string>(editMode);
    const [hasRenderError, setHasRenderError] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // 處理選手點擊事件
    const handleGamerClick = useCallback(
      (matchId: string, selectedGamer: Gamer) => {
        if (currentEditMode === 'GAMER_EDIT') return;
        if (!onMatchUpdate) return;

        const currentMatch = matches.find((m) => m.id === matchId);
        if (!currentMatch) return;

        if (currentMatch.round > 1 && (!currentMatch.gamer1 || !currentMatch.gamer2)) {
          return;
        }

        const totalRounds = Math.floor(Math.log2(gamers.length));

        // 切換勝負狀態邏輯
        if (currentMatch.winner?.id === selectedGamer.id) {
          // 取消勝者時，清除該選手在整個後續路徑的記錄
          let updatedMatches = matches.map((match) => (match.id === matchId ? { ...match, winner: null } : match));

          // 清除該選手在所有後續輪次的完整路徑
          const clearPlayerFromSubsequentRounds = (playerToClear: Gamer, startRound: number, startMatchIndex: number) => {
            let currentRound = startRound;
            let currentMatchIndex = startMatchIndex;

            // 追蹤該選手的整條晉級路徑
            while (currentRound < totalRounds) {
              const nextRound = currentRound + 1;
              const nextMatchIndex = Math.floor(currentMatchIndex / 2);
              const nextMatchId = `round${nextRound}-match${nextMatchIndex}`;

              const nextMatch = updatedMatches.find((m) => m.id === nextMatchId);
              if (!nextMatch) break;

              let playerFoundInMatch = false;
              const updates: {
                gamer1?: Gamer | null;
                gamer2?: Gamer | null;
                winner?: Gamer | null;
              } = {};

              // 檢查並清除該選手在這場比賽中的所有記錄
              if (nextMatch.gamer1?.id === playerToClear.id) {
                updates.gamer1 = null;
                playerFoundInMatch = true;
              }
              if (nextMatch.gamer2?.id === playerToClear.id) {
                updates.gamer2 = null;
                playerFoundInMatch = true;
              }
              if (nextMatch.winner?.id === playerToClear.id) {
                updates.winner = null;
                playerFoundInMatch = true;
              }

              // 如果找到該選手，清除記錄
              if (playerFoundInMatch) {
                updatedMatches = updatedMatches.map((m) => (m.id === nextMatchId ? { ...m, ...updates } : m));

                // 繼續追蹤到下一輪
                currentRound = nextRound;
                currentMatchIndex = nextMatchIndex;
              } else {
                // 如果該選手不在這場比賽中，停止追蹤
                break;
              }
            }
          };

          // 開始清除該選手的整條晉級路徑
          clearPlayerFromSubsequentRounds(selectedGamer, currentMatch.round, currentMatch.matchIndex);

          onMatchUpdate(updatedMatches);
          return;
        }

        // 選擇新的勝者並更新下一輪（原邏輯保持不變）
        let updatedMatches = matches.map((match) => (match.id === matchId ? { ...match, winner: selectedGamer } : match));

        if (currentMatch.round < totalRounds) {
          const nextRound = currentMatch.round + 1;
          const nextMatchIndex = Math.floor(currentMatch.matchIndex / 2);
          const nextMatchId = `round${nextRound}-match${nextMatchIndex}`;
          const isFirstSlot = currentMatch.matchIndex % 2 === 0;

          updatedMatches = updatedMatches.map((match) => {
            if (match.id === nextMatchId) {
              return {
                ...match,
                [isFirstSlot ? 'gamer1' : 'gamer2']: selectedGamer,
              };
            }
            return match;
          });
        }

        onMatchUpdate(updatedMatches);
      },
      [currentEditMode, onMatchUpdate, matches, gamers.length]
    );

    // 編輯狀態
    const gamerEditState = useMemo(
      () => ({
        gamerId: null,
        tempName: '',
        isEditing: false,
      }),
      []
    );

    // 生成節點和邊線
    const [nodes, setNodes, onNodesChange] = useNodesState<TournamentNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<TournamentEdge>([]);

    // 選擇適當的節點類型
    const nodeTypesToUse = useMemo(() => (isEditMode ? optimizedNodeTypes : viewOnlyNodeTypes), [isEditMode]);

    const emptyHandler = useCallback(() => {
      // 這是有意為之的空函數
    }, []);

    // 修正：改善節點和邊線的創建時機
    useEffect(() => {
      const updateNodesAndEdges = () => {
        // 移除 async
        try {
          setHasRenderError(false);

          // 先創建節點
          const newNodes = matchesToNodes(
            matches,
            gamers,
            isEditMode,
            currentEditMode,
            gamerEditState,
            handleGamerClick,
            emptyHandler,
            emptyHandler,
            emptyHandler,
            onGamerNameEdit,
            onGamerGamesEdit
          );

          // 創建邊線
          const newEdges = createTournamentEdges(matches, gamers);

          // 驗證邊線
          const validatedEdges = validateEdges(newEdges, newNodes);

          // 同時設置節點和邊線
          setNodes(newNodes);
          setEdges(validatedEdges);
          setIsInitialized(true);
        } catch (error) {
          console.error('更新節點和邊線時發生錯誤:', error);
          setHasRenderError(true);
          setNodes([]);
          setEdges([]);
        }
      };

      // 只有在有基本數據時才執行
      if (matches.length > 0 && gamers.length > 0) {
        updateNodesAndEdges();
      } else {
        setNodes([]);
        setEdges([]);
        setIsInitialized(false);
      }
    }, [
      matches,
      gamers,
      isEditMode,
      currentEditMode,
      handleGamerClick,
      onGamerNameEdit,
      onGamerGamesEdit,
      setNodes,
      setEdges,
      gamerEditState,
      emptyHandler,
    ]);

    // 同步外部 editMode 變化
    useEffect(() => {
      setCurrentEditMode(editMode);
    }, [editMode]);

    // 控制方法
    const setOptimalView = useCallback(() => {
      reactFlowInstance.setViewport(VIEWPORT_CONFIG.defaultViewport);
    }, [reactFlowInstance]);

    const handleReactFlowInit = useCallback(() => {
      setOptimalView();
    }, [setOptimalView]);

    const handleSetEditMode = useCallback((mode: string) => {
      setCurrentEditMode(mode);
    }, []);

    // 暴露 ref 方法（移除繪圖相關）
    useImperativeHandle(ref, () => ({
      setOptimalView,
      setFullscreenView: () => reactFlowInstance.fitView({ padding: 0.1, interpolate: 'smooth', duration: 1000 }),
      zoomIn: () => reactFlowInstance.zoomIn(),
      zoomOut: () => reactFlowInstance.zoomOut(),
      setEditMode: handleSetEditMode,
      downloadImage: () => downloadImage(reactFlowInstance, tournamentTitle),
    }));

    // 流程配置（移除繪圖相關）
    const flowConfig = useMemo(() => createFlowConfig(isEditMode, currentEditMode), [isEditMode, currentEditMode]);

    if (hasRenderError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-red-50">
          <div className="text-center p-4">
            <h3 className="text-lg font-semibold text-red-600 mb-2">賽程表渲染錯誤</h3>
            <p className="text-gray-600 mb-4">請刷新頁面重試</p>
            <button
              onClick={() => {
                setHasRenderError(false);
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              重新載入
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="w-full h-full relative transition-colors duration-300"
        style={{ backgroundColor: '#1f2937' }} // 直接使用深色背景
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypesToUse}
          onInit={handleReactFlowInit}
          {...flowConfig}
          fitView={true}
          style={{ width: '100%', height: '100%' }} // 確保完整覆蓋
        >
          <Background color="#4b5563" size={1} />

          {/* 觀看模式的控制面板 */}
          <Controls showZoom={true} showFitView={true} showInteractive={false} className="text-black" />

          {/* 模式標識 */}
          {!isEditMode && (
            <Panel position="bottom-left">
              <div className="bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">觀看模式</div>
            </Panel>
          )}

          {/* 載入狀態指示器 */}
          {!isInitialized && (
            <Panel position="top-center">
              <div className="bg-blue-500 text-white px-3 py-2 rounded text-sm">載入賽程表中...</div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    );
  }
);

FinalTournamentReactFlowInner.displayName = 'FinalTournamentReactFlowInner';

// 最終的主要組件
const FinalTournamentReactFlow = forwardRef<SingleEliminationReactFlowRef, SingleEliminationReactFlowProps>((props, ref) => {
  return (
    <ReactFlowProvider>
      <FinalTournamentReactFlowInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

FinalTournamentReactFlow.displayName = 'FinalTournamentReactFlow';

export default FinalTournamentReactFlow;
