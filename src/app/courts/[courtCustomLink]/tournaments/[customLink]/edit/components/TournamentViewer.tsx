import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo } from 'react';

import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { createTournamentEdges, matchesToNodes } from './dataTransformers';
import { viewOnlyNodeTypes } from './nodes/viewOnlyNodeTypes';
import { COLORS, VIEWPORT_CONFIG } from './reactFlowConstants';
import {
  SingleEliminationReactFlowProps,
  SingleEliminationReactFlowRef,
  TournamentEdge,
  TournamentNode,
} from './reactFlowTypes';

// 觀看模式的配置
const VIEWER_CONFIG = {
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: false,
  panOnDrag: true,
  zoomOnScroll: true,
  zoomOnDoubleClick: true,
  panOnScroll: false,
  preventScrolling: true,
  minZoom: 0.1,
  maxZoom: 2,
  defaultEdgeOptions: {
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#f97316',
      strokeWidth: 2,
    },
  },
};

// 內部組件
const TournamentViewerInner = forwardRef<
  SingleEliminationReactFlowRef,
  Pick<SingleEliminationReactFlowProps, 'gamers' | 'matches'>
>(({ gamers, matches }, ref) => {
  const reactFlowInstance = useReactFlow();

  // 生成節點和邊線
  const [nodes, setNodes, onNodesChange] = useNodesState<TournamentNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TournamentEdge>([]);

  const emptyHandler = useCallback(() => {
    // 這是有意為之的空函數，用於觀看模式
  }, []);

  // 簡化的數據處理
  const dummyCallbacks = useMemo(
    () => ({
      onGamerClick: emptyHandler,
      onGamerDoubleClick: emptyHandler,
      onConfirmEdit: emptyHandler,
      onCancelEdit: emptyHandler,
    }),
    [emptyHandler]
  );

  const gamerEditState = useMemo(
    () => ({
      gamerId: null,
      tempName: '',
      isEditing: false,
    }),
    []
  );

  // 當數據變化時更新節點和邊線
  useEffect(() => {
    const newNodes = matchesToNodes(
      matches,
      gamers,
      false, // isEditMode = false
      'NORMAL', // editMode = NORMAL
      gamerEditState,
      dummyCallbacks.onGamerClick,
      dummyCallbacks.onGamerDoubleClick,
      dummyCallbacks.onConfirmEdit,
      dummyCallbacks.onCancelEdit,
      undefined, // onGamerNameEdit
      undefined // onGamerGamesEdit
    );
    const newEdges = createTournamentEdges(matches, gamers);

    setNodes(newNodes);
    setEdges(newEdges);
  }, [matches, gamers, gamerEditState, dummyCallbacks, setNodes, setEdges]);

  // 觀看模式的控制方法
  const setOptimalView = useCallback(() => {
    reactFlowInstance.setViewport(VIEWPORT_CONFIG.defaultViewport);
  }, [reactFlowInstance]);

  const fitToScreen = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.1 });
  }, [reactFlowInstance]);

  // 暴露觀看模式的 ref 方法
  useImperativeHandle(ref, () => ({
    setOptimalView,
    setFullscreenView: fitToScreen,
    zoomIn: () => reactFlowInstance.zoomIn(),
    zoomOut: () => reactFlowInstance.zoomOut(),
    setEditMode: emptyHandler, // 觀看模式不支援編輯
  }));

  // 初始化視角
  useEffect(() => {
    const timer = setTimeout(() => {
      setOptimalView();
    }, 100);
    return () => clearTimeout(timer);
  }, [setOptimalView]);

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: COLORS.canvasBackground }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={viewOnlyNodeTypes}
        {...VIEWER_CONFIG}
        fitView={false}
      >
        <Background color="#555" size={1} />

        {/* 觀看模式的控制面板 */}
        <Controls showZoom={true} showFitView={true} showInteractive={false} className="react-flow__controls-viewer" />
      </ReactFlow>

      {/* 觀看模式標識 */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">觀看模式</div>
    </div>
  );
});

TournamentViewerInner.displayName = 'TournamentViewerInner';

// 主要的觀看模式組件
const TournamentViewer = forwardRef<
  SingleEliminationReactFlowRef,
  Pick<SingleEliminationReactFlowProps, 'gamers' | 'matches'>
>((props, ref) => {
  return (
    <ReactFlowProvider>
      <TournamentViewerInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

TournamentViewer.displayName = 'TournamentViewer';

export default TournamentViewer;
