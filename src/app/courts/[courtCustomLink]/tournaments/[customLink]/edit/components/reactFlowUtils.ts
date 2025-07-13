import { Gamer, Match } from '@/domains/tournament';

import { LAYOUT, NODE_TYPES } from './reactFlowConstants';
import { TournamentEdge, TournamentNode } from './reactFlowTypes';

// 位置計算 - 與原 Konva 算法完全一致
export const calculateMatchPosition = (round: number, matchIndex: number, totalRounds: number): { x: number; y: number } => {
  if (round === 1) {
    const x = LAYOUT.titleWidth + LAYOUT.canvasLeftPadding + matchIndex * LAYOUT.gamerSpacing + LAYOUT.boxHeight;
    const y =
      LAYOUT.headerHeight +
      (totalRounds - 1) * LAYOUT.roundHeight +
      LAYOUT.canvasBottomPadding -
      LAYOUT.boxHeight +
      LAYOUT.boxHeight / 2;
    return { x, y };
  } else {
    // 遞迴計算前一輪位置
    const prevMatch1Index = matchIndex * 2;
    const prevMatch2Index = matchIndex * 2 + 1;
    const prevMatch1Pos = calculateMatchPosition(round - 1, prevMatch1Index, totalRounds);
    const prevMatch2Pos = calculateMatchPosition(round - 1, prevMatch2Index, totalRounds);

    const x = (prevMatch1Pos.x + prevMatch2Pos.x) / 2;
    const y =
      LAYOUT.headerHeight +
      (totalRounds - round) * LAYOUT.roundHeight +
      LAYOUT.canvasBottomPadding -
      LAYOUT.boxHeight +
      LAYOUT.boxHeight / 2;

    return { x, y };
  }
};

// 計算冠軍位置
export const calculateChampionPosition = (totalRounds: number): { x: number; y: number } => {
  const finalMatchPos = calculateMatchPosition(totalRounds, 0, totalRounds);
  return {
    x: finalMatchPos.x + (LAYOUT.boxWidth - LAYOUT.championBoxWidth) / 2,
    y: LAYOUT.headerHeight + LAYOUT.championTopMargin,
  };
};

// 計算輪次標題位置
export const calculateRoundTitlePosition = (roundNumber: number, totalRounds: number): { x: number; y: number } => {
  const titleY =
    LAYOUT.headerHeight +
    (totalRounds - roundNumber) * LAYOUT.roundHeight +
    LAYOUT.canvasBottomPadding -
    LAYOUT.boxHeight +
    LAYOUT.boxHeight / 2 -
    8 +
    LAYOUT.roundHeight / 2;
  return { x: 0, y: titleY };
};

// 生成輪次名稱
export const getRoundName = (roundNumber: number, totalRounds: number): string => {
  if (roundNumber === totalRounds) return '決賽';
  if (roundNumber === totalRounds - 1) return '準決賽';
  if (roundNumber === totalRounds - 2) return '八強賽';
  if (roundNumber === totalRounds - 3) return '十六強賽';
  return `第 ${roundNumber} 輪`;
};

// 生成節點 ID
export const generateNodeId = (type: string, round?: number, matchIndex?: number): string => {
  if (type === NODE_TYPES.MATCH && round !== undefined && matchIndex !== undefined) {
    return `match-${round}-${matchIndex}`;
  }
  if (type === NODE_TYPES.CHAMPION) {
    return 'champion';
  }
  if (type === NODE_TYPES.ROUND_TITLE && round !== undefined) {
    return `round-title-${round}`;
  }
  return `${type}-${Date.now()}`;
};

// 生成邊線 ID
export const generateEdgeId = (source: string, target: string): string => {
  return `edge-${source}-${target}`;
};

// 比賽邏輯檢查函數
export const canMatchProceed = (match: Match): boolean => {
  return match.round === 1 || (match.gamer1 !== null && match.gamer2 !== null);
};

export const isGamerEmpty = (gamer: Gamer | null): boolean => {
  return !gamer || !gamer.name || gamer.name.trim() === '';
};

export const canClickGamer = (gamer: Gamer | null, match: Match, editMode: string): boolean => {
  if (editMode === 'GAMER_EDIT') return true;
  return !isGamerEmpty(gamer) && canMatchProceed(match);
};

// 找到冠軍
export const findChampion = (matches: Match[], totalRounds: number): Gamer | null => {
  const finalMatch = matches.find((match) => match.round === totalRounds);
  return finalMatch?.winner || null;
};

// 計算整體畫布尺寸
export const calculateCanvasDimensions = (gamerCount: number) => {
  const rounds = Math.floor(Math.log2(gamerCount));
  const firstRoundMatches = gamerCount / 2;

  const matchesAreaWidth = firstRoundMatches * LAYOUT.gamerSpacing;
  const sceneWidth = LAYOUT.titleWidth + LAYOUT.canvasLeftPadding + matchesAreaWidth + LAYOUT.canvasRightPadding;

  const sceneHeight =
    rounds * LAYOUT.roundHeight +
    LAYOUT.headerHeight +
    LAYOUT.boxHeight +
    LAYOUT.canvasBottomPadding +
    LAYOUT.sceneHeightExtra;

  return {
    width: sceneWidth,
    height: sceneHeight,
  };
};

// 樣式輔助函數
export const getGamerBoxClasses = (
  isWinner: boolean,
  canClick: boolean,
  isEmpty: boolean,
  isLeft: boolean,
  editMode: string,
  isEditing: boolean
): string => {
  const baseClasses = ['h-full', 'flex', 'items-center', 'justify-center', 'text-sm', 'font-medium', 'px-1', 'relative'];

  if (isLeft) baseClasses.push('border-r', 'border-gray-300');

  if (isEditing) {
    baseClasses.push('bg-blue-50', 'border-blue-200');
  } else if (isEmpty && editMode !== 'GAMER_EDIT') {
    baseClasses.push('text-gray-400', 'bg-gray-50');
  } else if (!canClick && editMode !== 'GAMER_EDIT') {
    baseClasses.push('bg-gray-100', 'text-gray-400');
  } else if (isWinner) {
    baseClasses.push('bg-yellow-100', 'border-orange-400');
  }

  return baseClasses.join(' ');
};

export const getCursorClass = (canClick: boolean, isEmpty: boolean, editMode: string): string => {
  if (editMode === 'GAMER_EDIT') return 'cursor-text';
  if (isEmpty) return 'cursor-default';
  return canClick ? 'cursor-pointer' : 'cursor-not-allowed';
};

// 修正：簡化邊線驗證函數
export const validateEdges = (edges: TournamentEdge[], nodes: TournamentNode[]): TournamentEdge[] => {
  const nodeIds = new Set(nodes.map((node) => node.id));

  return edges.filter((edge) => {
    const hasValidSource = nodeIds.has(edge.source);
    const hasValidTarget = nodeIds.has(edge.target);
    return hasValidSource && hasValidTarget;
  });
};

// 安全的節點 ID 生成器
export const safeGenerateNodeId = (type: string, round?: number, matchIndex?: number): string => {
  try {
    return generateNodeId(type, round, matchIndex);
  } catch (error) {
    return `fallback-${type}-${Date.now()}-${Math.random()}`;
  }
};

// 檢查邊線是否有效
export const isValidEdge = (edge: TournamentEdge, nodeIds: Set<string>): boolean => {
  return nodeIds.has(edge.source) && nodeIds.has(edge.target);
};

// 生成安全的 Handle ID
export const generateHandleId = (nodeId: string, type: 'source' | 'target'): string => {
  return `${nodeId}-${type}`;
};
