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
import { VIEWPORT_CONFIG } from './reactFlowConstants';
import DownloadButton from './ReactFlowDownloadButton';
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
      strokeWidth: 4,
    },
  },
};

// 內部組件
const TournamentViewerInner = forwardRef<
  SingleEliminationReactFlowRef,
  Pick<SingleEliminationReactFlowProps, 'gamers' | 'matches' | 'tournamentTitle'>
>(({ gamers, matches, tournamentTitle = '比賽' }, ref) => {
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

  const handleReactFlowInit = useCallback(() => {
    setOptimalView();
  }, [setOptimalView]);

  // 暴露觀看模式的 ref 方法
  useImperativeHandle(ref, () => ({
    setOptimalView,
    setFullscreenView: () => reactFlowInstance.fitView({ padding: 0.1, interpolate: 'smooth', duration: 1000 }),
    zoomIn: () => reactFlowInstance.zoomIn(),
    zoomOut: () => reactFlowInstance.zoomOut(),
    setEditMode: emptyHandler, // 觀看模式不支援編輯
  }));

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
        nodeTypes={viewOnlyNodeTypes}
        onInit={handleReactFlowInit}
        {...VIEWER_CONFIG}
        fitView={true}
      >
        <Background color="#555" size={1} />
        <DownloadButton
          buttonTextElement="下載賽程表"
          title={`${tournamentTitle}賽程表 - ${process.env.NEXT_PUBLIC_SITENAME}`}
        />

        {/* 觀看模式的控制面板 */}
        <div className="top-40">
          <Controls showZoom={true} showFitView={true} showInteractive={false} className="text-black" />
        </div>
      </ReactFlow>
    </div>
  );
});

TournamentViewerInner.displayName = 'TournamentViewerInner';

// 主要的觀看模式組件
const TournamentViewer = forwardRef<
  SingleEliminationReactFlowRef,
  Pick<SingleEliminationReactFlowProps, 'gamers' | 'matches' | 'tournamentTitle'>
>((props, ref) => {
  return (
    <ReactFlowProvider>
      <TournamentViewerInner {...props} ref={ref} />
    </ReactFlowProvider>
  );
});

TournamentViewer.displayName = 'TournamentViewer';

export default TournamentViewer;
