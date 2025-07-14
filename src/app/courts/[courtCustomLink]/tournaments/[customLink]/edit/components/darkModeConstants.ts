// 佈局常數
export const LAYOUT = {
  boxWidth: 100,
  boxHeight: 130,
  gamerSpacing: 110,
  roundHeight: 180, // 統一的輪次間距
  titleWidth: 180,
  headerHeight: 40,
  canvasLeftPadding: 0,
  canvasRightPadding: 0,
  canvasBottomPadding: 60,
  championBoxWidth: 150,
  championBoxHeight: 50,
  championTopMargin: 8,
  championToFinalGap: 0, // 設為 0，使用統一間距
  sceneHeightExtra: 40,
  titlePadding: 8, // 標題與邊緣的間距
};

// 視口設置
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

// 樣式常數
export const STYLES = {
  // 比賽節點樣式
  matchNode: 'bg-gray-800 border border-gray-600 rounded shadow-sm overflow-hidden',
  matchNodeEdit: 'bg-gray-700 border-2 border-blue-400 rounded shadow-md overflow-hidden',
  // 冠軍節點樣式
  championNode: 'bg-yellow-600 border-2 border-orange-400 rounded shadow-md overflow-hidden',
  // 輪次標題節點樣式
  roundTitleNode: 'bg-gray-800 bg-opacity-90 border border-gray-600 rounded shadow-sm overflow-hidden',
  championTitleNode: 'bg-yellow-600 border-2 border-orange-400 rounded shadow-md overflow-hidden',
  // 選手框樣式
  gamerBox: 'h-full flex items-center justify-center text-sm font-medium px-1 text-gray-100',
  gamerBoxLeft: 'border-r border-gray-600',
  gamerBoxRight: '',
  gamerBoxWinner: 'bg-yellow-900 border-orange-400 text-yellow-100',
  gamerBoxEmpty: 'text-gray-500 bg-gray-700',
  gamerBoxDisabled: 'bg-gray-700 text-gray-500',
  gamerBoxEditable: 'bg-blue-900 border-blue-200 text-blue-100',
  // 文字樣式
  championText: 'text-gray-900 font-bold text-center truncate',
  roundTitleText: 'text-gray-200 font-medium text-center px-2',
  championTitleText: 'text-gray-900 font-bold text-center px-2',
  gamerText: 'truncate text-center text-gray-100',
  // 遊戲局數框樣式
  gamesBox: 'w-12 h-6 bg-gray-700 border border-gray-600 rounded text-xs flex items-center justify-center text-gray-200',
  gamesBoxEdit: 'w-12 h-6 bg-gray-600 border border-blue-400 rounded text-xs flex items-center justify-center text-gray-100',
  // 圖標樣式
  lockIcon: 'absolute top-1 right-1 text-xs opacity-60',
  crownIcon: 'text-base ml-1',
  // 編輯輸入框樣式
  editInputFocused:
    'w-full h-full text-center border-2 border-blue-400 rounded bg-blue-900 text-blue-100 font-bold outline-none px-1',
};

// 顏色常數
export const COLORS = {
  canvasBackground: '#1f2937', // gray-800
  stroke: '#4b5563', // gray-600
  highlight: '#f97316',
  text: '#f9fafb', // gray-50
  winnerHighlight: '#451a03', // yellow-900
  championBackground: '#d97706', // yellow-600
  emptySlot: '#374151', // gray-700
  disabled: '#374151', // gray-700
  disabledText: '#6b7280', // gray-500
  connectionLine: '#f97316',
};

export const DOT_STYLE = {
  left: '50%',
  background: '#f97316',
  border: 'none',
  width: '2px',
  height: '2px',
  borderRadius: '50%',
};
