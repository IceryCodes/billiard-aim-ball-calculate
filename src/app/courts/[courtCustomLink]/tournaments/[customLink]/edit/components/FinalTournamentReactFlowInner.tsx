import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from 'react';

import { Background, Panel, ReactFlow, ReactFlowProvider, useEdgesState, useNodesState, useReactFlow } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

import { Gamer } from '@/domains/tournament';

import { getThemedColors, isDarkMode } from './darkModeConstants';
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
  elementsSelectable: isEditMode,
  panOnDrag: true,
  zoomOnScroll: editMode !== 'GAMER_EDIT', // 只在非編輯選手模式下允許滾輪縮放
  zoomOnDoubleClick: !isEditMode,
  panOnScroll: false,
  preventScrolling: false,
  minZoom: 0.1,
  maxZoom: isEditMode ? 3 : 2,
  defaultEdgeOptions: {
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#f97316',
      strokeWidth: 3,
    },
  },
});

// 內部組件（移除繪圖功能）
const FinalTournamentReactFlowInner = forwardRef<SingleEliminationReactFlowRef, SingleEliminationReactFlowProps>(
  ({ gamers, matches, isEditMode = false, onMatchUpdate, editMode = 'NORMAL', onGamerNameEdit, onGamerGamesEdit }, ref) => {
    const reactFlowInstance = useReactFlow();
    const [currentEditMode, setCurrentEditMode] = useState<string>(editMode);
    const [darkMode, setDarkMode] = useState<boolean>(false);
    const [hasRenderError, setHasRenderError] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // 監聽 Dark Mode 變化
    useEffect(() => {
      const updateDarkMode = () => setDarkMode(isDarkMode());
      updateDarkMode();

      const observer = new MutationObserver(updateDarkMode);
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      return () => observer.disconnect();
    }, []);

    // 獲取主題化的顏色
    const themedColors = useMemo(() => getThemedColors(), []);

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

        // 切換勝負狀態邏輯
        if (currentMatch.winner?.id === selectedGamer.id) {
          const updatedMatches = matches.map((match) => (match.id === matchId ? { ...match, winner: null } : match));
          onMatchUpdate(updatedMatches);
          return;
        }

        // 選擇新的勝者並更新下一輪
        let updatedMatches = matches.map((match) => (match.id === matchId ? { ...match, winner: selectedGamer } : match));

        const totalRounds = Math.floor(Math.log2(gamers.length));
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
      const updateNodesAndEdges = async () => {
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

          // 立即設置節點
          setNodes(newNodes);

          // 等待節點渲染完成後再創建邊線
          await new Promise((resolve) => setTimeout(resolve, 300));

          // 創建邊線
          const newEdges = createTournamentEdges(matches, gamers);

          // 驗證邊線
          const validatedEdges = validateEdges(newEdges, newNodes);

          // 如果有無效邊線，記錄詳細信息
          if (newEdges.length !== validatedEdges.length) {
            const invalidEdges = newEdges.filter((edge) => !validatedEdges.includes(edge));
            console.warn('發現無效邊線:', invalidEdges);
            console.warn(
              '可用節點ID:',
              newNodes.map((node) => node.id)
            );
          }

          // 設置驗證過的邊線
          setEdges(validatedEdges);
          setIsInitialized(true);
        } catch (error) {
          console.error('更新節點和邊線時發生錯誤:', error);
          setHasRenderError(true);
          // 設置空陣列以避免渲染錯誤
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

    const fitToScreen = useCallback(() => {
      reactFlowInstance.fitView({ padding: 0.1 });
    }, [reactFlowInstance]);

    const handleSetEditMode = useCallback((mode: string) => {
      setCurrentEditMode(mode);
    }, []);

    // 暴露 ref 方法（移除繪圖相關）
    useImperativeHandle(ref, () => ({
      setOptimalView,
      setFullscreenView: isEditMode ? setOptimalView : fitToScreen,
      zoomIn: () => reactFlowInstance.zoomIn(),
      zoomOut: () => reactFlowInstance.zoomOut(),
      setEditMode: handleSetEditMode,
    }));

    // 初始化視角 - 等待數據載入完成
    useEffect(() => {
      if (isInitialized) {
        const timer = setTimeout(() => {
          setOptimalView();
        }, 200);
        return () => clearTimeout(timer);
      }
    }, [setOptimalView, isInitialized]);

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
        style={{ backgroundColor: themedColors.canvasBackground }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypesToUse}
          {...flowConfig}
          fitView={false}
        >
          <Background color={darkMode ? '#374151' : '#555'} size={1} className="transition-colors duration-300" />

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
