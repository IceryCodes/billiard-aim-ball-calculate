// nodes/optimizedNodeTypes.ts

import { NodeTypes } from '@xyflow/react';

// 正確的 import 路徑
import EditableMatchNode from '../EditableMatchNode';
import { QRCodeNode } from '../TournamentShared';

import OptimizedChampionNode from './OptimizedChampionNode';
import OptimizedMatchNode from './OptimizedMatchNode';
import OptimizedRoundTitleNode from './OptimizedRoundTitleNode';

export const optimizedNodeTypes: NodeTypes = {
  match: EditableMatchNode, // 編輯模式使用可編輯節點
  champion: OptimizedChampionNode,
  roundTitle: OptimizedRoundTitleNode,
  qrCode: QRCodeNode,
};

// 觀看模式的節點類型（保持不變）
export const viewOnlyNodeTypes: NodeTypes = {
  match: OptimizedMatchNode, // 觀看模式使用原始節點
  champion: OptimizedChampionNode,
  roundTitle: OptimizedRoundTitleNode,
};
