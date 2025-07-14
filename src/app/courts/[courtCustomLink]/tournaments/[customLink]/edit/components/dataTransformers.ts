import { Gamer, Match } from '@/domains/tournament';

import { NODE_TYPES } from './reactFlowConstants';
import {
  ChampionNode,
  ChampionNodeData,
  MatchNode,
  MatchNodeData,
  RoundTitleNode,
  RoundTitleNodeData,
  TournamentEdge,
  TournamentNode,
} from './reactFlowTypes';
import {
  calculateChampionPosition,
  calculateChampionTitlePosition,
  calculateMatchPosition,
  calculateRoundTitlePosition,
  findChampion,
  generateNodeId,
  getRoundName,
} from './reactFlowUtils';

/**
 * 將比賽數據轉換為 React Flow 節點
 */
export const matchesToNodes = (
  matches: Match[],
  gamers: Gamer[],
  isEditMode: boolean,
  editMode: string,
  gamerEditState: { gamerId: number | null; tempName: string; isEditing: boolean },
  onGamerClick: (matchId: string, gamer: Gamer) => void,
  onGamerDoubleClick: (gamer: Gamer) => void,
  onConfirmEdit: (newValue: string) => void,
  onCancelEdit: () => void,
  onGamerNameEdit?: (gamerId: number, newName: string) => void,
  onGamerGamesEdit?: (gamerId: number, newGames: number) => void
): TournamentNode[] => {
  const nodes: TournamentNode[] = [];
  const totalRounds = Math.floor(Math.log2(gamers.length));

  try {
    // 1. 創建比賽節點 - 移除額外偏移
    matches.forEach((match) => {
      const position = calculateMatchPosition(match.round, match.matchIndex, totalRounds);
      const matchNodeData: MatchNodeData = {
        match,
        isEditMode,
        onGamerClick,
        onGamesEdit: onGamerGamesEdit,
        editMode,
        gamerEditState,
        onConfirmEdit,
        onCancelEdit,
        onGamerNameEdit,
        onGamerGamesEdit,
        totalRounds,
      };

      const matchNode: MatchNode = {
        id: generateNodeId(NODE_TYPES.MATCH, match.round, match.matchIndex),
        type: 'match',
        position: {
          x: position.x,
          y: position.y, // 移除 championToFinalGap 偏移
        },
        data: matchNodeData,
        draggable: false,
        selectable: true,
      };

      nodes.push(matchNode);
    });

    // 2. 創建輪次標題節點 - 使用新的對齊位置
    for (let round = 1; round <= totalRounds; round++) {
      const position = calculateRoundTitlePosition(round, totalRounds);
      const roundTitleData: RoundTitleNodeData = {
        roundNumber: round,
        totalRounds,
        title: getRoundName(round, totalRounds),
      };

      const roundTitleNode: RoundTitleNode = {
        id: generateNodeId(NODE_TYPES.ROUND_TITLE, round),
        type: 'roundTitle',
        position: {
          x: position.x,
          y: position.y, // 移除額外偏移
        },
        data: roundTitleData,
        draggable: false,
        selectable: false,
      };

      nodes.push(roundTitleNode);
    }

    // 3. 創建冠軍標題節點 - 使用新的計算函數
    const championTitlePosition = calculateChampionTitlePosition(totalRounds);
    const championTitleData: RoundTitleNodeData = {
      roundNumber: 0,
      totalRounds,
      title: '冠軍',
    };

    const championTitleNode: RoundTitleNode = {
      id: 'champion-title',
      type: 'roundTitle',
      position: {
        x: championTitlePosition.x,
        y: championTitlePosition.y,
      },
      data: championTitleData,
      draggable: false,
      selectable: false,
    };

    nodes.push(championTitleNode);

    // 4. 創建冠軍節點（如果有冠軍）- 使用新的位置計算
    const champion = findChampion(matches, totalRounds);
    if (champion) {
      const position = calculateChampionPosition(totalRounds);
      const championData: ChampionNodeData = {
        champion,
      };

      const championNode: ChampionNode = {
        id: generateNodeId(NODE_TYPES.CHAMPION),
        type: 'champion',
        position: {
          x: position.x,
          y: position.y, // 使用新的統一位置計算
        },
        data: championData,
        draggable: false,
        selectable: false,
      };

      nodes.push(championNode);
    }

    const qrCodeNode: TournamentNode = {
      id: 'qr-code',
      type: 'qrCode',
      position: {
        x: 250, // 調整位置
        y: -20,
      },
      data: {},
      draggable: true,
      selectable: false,
      resizing: true,
    };

    nodes.push(qrCodeNode);

    return nodes;
  } catch (error) {
    return [];
  }
};

/**
 * 創建比賽之間的連接線
 */
export const createTournamentEdges = (matches: Match[], gamers: Gamer[]): TournamentEdge[] => {
  const edges: TournamentEdge[] = [];
  const totalRounds = Math.floor(Math.log2(gamers.length));

  try {
    // 1. 創建比賽間的連接線（每輪的勝者連接到下一輪）
    for (let round = 1; round < totalRounds; round++) {
      const currentRoundMatches = matches.filter((m) => m.round === round);

      currentRoundMatches.forEach((currentMatch) => {
        // 只有當前比賽有勝者時才創建連接線
        if (!currentMatch.winner) return;

        // 計算這場比賽的勝者應該進入下一輪的哪場比賽
        const nextRound = round + 1;
        const nextMatchIndex = Math.floor(currentMatch.matchIndex / 2);

        // 生成節點 ID
        const sourceNodeId = generateNodeId(NODE_TYPES.MATCH, currentMatch.round, currentMatch.matchIndex);
        const targetNodeId = generateNodeId(NODE_TYPES.MATCH, nextRound, nextMatchIndex);

        // 檢查目標比賽是否存在
        const targetMatch = matches.find((m) => m.round === nextRound && m.matchIndex === nextMatchIndex);
        if (!targetMatch) return;

        const edge: TournamentEdge = {
          id: `edge-${sourceNodeId}-to-${targetNodeId}`,
          source: sourceNodeId,
          target: targetNodeId,
          sourceHandle: `${sourceNodeId}-source`,
          targetHandle: `${targetNodeId}-target`,
          type: 'smoothstep',
          style: {
            stroke: '#f97316',
            strokeWidth: 4, // 統一使用較細的線條
          },
          animated: false,
          markerEnd: undefined, // 確保沒有箭頭
        };

        edges.push(edge);
      });
    }

    // 2. 創建決賽到冠軍的連接線
    const finalMatch = matches.find((m) => m.round === totalRounds);
    if (finalMatch && finalMatch.winner) {
      const sourceNodeId = generateNodeId(NODE_TYPES.MATCH, finalMatch.round, finalMatch.matchIndex);
      const targetNodeId = generateNodeId(NODE_TYPES.CHAMPION);

      const championEdge: TournamentEdge = {
        id: 'edge-final-to-champion',
        source: sourceNodeId,
        target: targetNodeId,
        sourceHandle: `${sourceNodeId}-source`,
        targetHandle: `${targetNodeId}-target`,
        type: 'smoothstep',
        style: {
          stroke: '#f97316',
          strokeWidth: 4, // 統一使用較細的線條
        },
        animated: false,
        markerEnd: undefined, // 確保沒有箭頭
      };

      edges.push(championEdge);
    }

    return edges;
  } catch (error) {
    return [];
  }
};
