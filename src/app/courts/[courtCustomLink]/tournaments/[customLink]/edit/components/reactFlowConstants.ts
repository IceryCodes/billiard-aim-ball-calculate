// 佈局常數 - 與原 Konva 版本保持一致
export const LAYOUT = {
  boxWidth: 100,
  boxHeight: 100,
  gamerSpacing: 110,
  roundHeight: 130,
  titleWidth: 180,
  headerHeight: 40,
  canvasLeftPadding: 0,
  canvasRightPadding: 0,
  canvasBottomPadding: 60,
  championBoxWidth: 150,
  championBoxHeight: 50,
  championTopMargin: 8,
  championToFinalGap: 50,
  sceneHeightExtra: 40,
};

// @xyflow/react 配置 - 移除無效的 props
export const REACT_FLOW_CONFIG = {
  // 節點設置
  nodesDraggable: false,
  nodesConnectable: false,
  elementsSelectable: true,
  // 互動設置
  panOnDrag: true,
  zoomOnScroll: true,
  zoomOnDoubleClick: false,
  panOnScroll: false,
  preventScrolling: true,
  // 縮放設置
  minZoom: 0.1,
  maxZoom: 3,
  // 邊線設置
  defaultEdgeOptions: {
    type: 'smoothstep',
    animated: false,
    style: {
      stroke: '#f97316',
      strokeWidth: 2,
    },
  },
};

// 視口設置 - 移到單獨的常數
export const VIEWPORT_CONFIG = {
  defaultViewport: {
    x: 28.99,
    y: 21.04,
    zoom: 0.71,
  },
};

// 節點類型常數
export const NODE_TYPES = {
  MATCH: 'match',
  CHAMPION: 'champion',
  ROUND_TITLE: 'roundTitle',
} as const;

// 樣式常數 - 使用 Tailwind classes
export const STYLES = {
  // 比賽節點樣式
  matchNode: 'bg-white border border-gray-300 rounded shadow-sm overflow-hidden',
  matchNodeEdit: 'bg-white border-2 border-blue-400 rounded shadow-md overflow-hidden',
  // 冠軍節點樣式
  championNode: 'bg-yellow-400 border-2 border-orange-500 rounded shadow-md overflow-hidden',
  // 輪次標題節點樣式
  roundTitleNode: 'bg-white bg-opacity-90 border border-gray-300 rounded shadow-sm overflow-hidden',
  championTitleNode: 'bg-yellow-400 border-2 border-orange-500 rounded shadow-md overflow-hidden',
  // 選手框樣式
  gamerBox: 'h-full flex items-center justify-center text-sm font-medium px-1',
  gamerBoxLeft: 'border-r border-gray-300',
  gamerBoxRight: '',
  gamerBoxWinner: 'bg-yellow-100 border-orange-400',
  gamerBoxEmpty: 'text-gray-400 bg-gray-50',
  gamerBoxDisabled: 'bg-gray-100 text-gray-400',
  gamerBoxEditable: 'bg-blue-50 border-blue-200',
  // 文字樣式
  championText: 'text-black font-bold text-center truncate',
  roundTitleText: 'text-gray-700 font-medium text-center px-2',
  championTitleText: 'text-black font-bold text-center px-2',
  gamerText: 'truncate text-center',
  // 遊戲局數框樣式
  gamesBox: 'w-12 h-6 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center',
  gamesBoxEdit: 'w-12 h-6 bg-white border border-blue-400 rounded text-xs flex items-center justify-center',
  // 圖標樣式
  lockIcon: 'absolute top-1 right-1 text-xs opacity-60',
  crownIcon: 'text-base ml-1',
};

// 顏色常數 - 與原 Konva 版本保持一致
export const COLORS = {
  stroke: '#d1d5db',
  highlight: '#f97316',
  text: '#000000',
  winnerHighlight: '#fef3c7',
  championBackground: '#ffd700',
  emptySlot: '#f9fafb',
  disabled: '#f3f4f6',
  disabledText: '#9ca3af',
  canvasBackground: '#363636',
  connectionLine: '#f97316',
};
