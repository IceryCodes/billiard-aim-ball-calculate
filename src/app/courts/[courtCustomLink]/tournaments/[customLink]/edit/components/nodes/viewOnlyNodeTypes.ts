import { QRCodeNode } from '../TournamentShared';

import OptimizedChampionNode from './OptimizedChampionNode'; // 冠軍節點可以共用
import OptimizedRoundTitleNode from './OptimizedRoundTitleNode'; // 標題節點可以共用
import ViewOnlyMatchNode from './ViewOnlyMatchNode';

// 觀看模式的節點類型映射
export const viewOnlyNodeTypes = {
  match: ViewOnlyMatchNode,
  champion: OptimizedChampionNode,
  roundTitle: OptimizedRoundTitleNode,
  qrCode: QRCodeNode,
};

export { ViewOnlyMatchNode };
