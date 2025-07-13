// Dark Mode 樣式常數
export const DARK_MODE_STYLES = {
  // 比賽節點樣式 - Dark Mode
  matchNodeDark: 'bg-gray-800 border border-gray-600 rounded shadow-sm overflow-hidden',
  matchNodeEditDark: 'bg-gray-700 border-2 border-blue-400 rounded shadow-md overflow-hidden',
  // 冠軍節點樣式 - Dark Mode
  championNodeDark: 'bg-yellow-600 border-2 border-orange-400 rounded shadow-md overflow-hidden',
  // 輪次標題節點樣式 - Dark Mode
  roundTitleNodeDark: 'bg-gray-800 bg-opacity-90 border border-gray-600 rounded shadow-sm overflow-hidden',
  championTitleNodeDark: 'bg-yellow-600 border-2 border-orange-400 rounded shadow-md overflow-hidden',
  // 選手框樣式 - Dark Mode
  gamerBoxDark: 'h-full flex items-center justify-center text-sm font-medium px-1 text-gray-100',
  gamerBoxLeftDark: 'border-r border-gray-600',
  gamerBoxWinnerDark: 'bg-yellow-900 border-orange-400 text-yellow-100',
  gamerBoxEmptyDark: 'text-gray-500 bg-gray-700',
  gamerBoxDisabledDark: 'bg-gray-700 text-gray-500',
  gamerBoxEditableDark: 'bg-blue-900 border-blue-200 text-blue-100',
  // 文字樣式 - Dark Mode
  championTextDark: 'text-gray-900 font-bold text-center truncate',
  roundTitleTextDark: 'text-gray-200 font-medium text-center px-2',
  championTitleTextDark: 'text-gray-900 font-bold text-center px-2',
  gamerTextDark: 'truncate text-center text-gray-100',
  // 遊戲局數框樣式 - Dark Mode
  gamesBoxDark: 'w-12 h-6 bg-gray-700 border border-gray-600 rounded text-xs flex items-center justify-center text-gray-200',
  gamesBoxEditDark:
    'w-12 h-6 bg-gray-600 border border-blue-400 rounded text-xs flex items-center justify-center text-gray-100',
  // 編輯輸入框樣式 - Dark Mode
  editInputFocusedDark:
    'w-full h-full text-center border-2 border-blue-400 rounded bg-blue-900 text-blue-100 font-bold outline-none px-1',
};

// Dark Mode 顏色常數
export const DARK_MODE_COLORS = {
  canvasBackground: '#1f2937', // gray-800
  stroke: '#4b5563', // gray-600
  highlight: '#f97316', // 保持橙色高亮
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

// 檢測 Dark Mode 的工具函數
export const isDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
};

// 獲取適當的樣式
export const getThemedStyles = () => {
  const dark = isDarkMode();
  return {
    // 比賽節點樣式
    matchNode: dark ? DARK_MODE_STYLES.matchNodeDark : 'bg-white border border-gray-300 rounded shadow-sm overflow-hidden',
    matchNodeEdit: dark
      ? DARK_MODE_STYLES.matchNodeEditDark
      : 'bg-white border-2 border-blue-400 rounded shadow-md overflow-hidden',
    // 冠軍節點樣式
    championNode: dark
      ? DARK_MODE_STYLES.championNodeDark
      : 'bg-yellow-400 border-2 border-orange-500 rounded shadow-md overflow-hidden',

    // 輪次標題節點樣式
    roundTitleNode: dark
      ? DARK_MODE_STYLES.roundTitleNodeDark
      : 'bg-white bg-opacity-90 border border-gray-300 rounded shadow-sm overflow-hidden',
    championTitleNode: dark
      ? DARK_MODE_STYLES.championTitleNodeDark
      : 'bg-yellow-400 border-2 border-orange-500 rounded shadow-md overflow-hidden',

    // 選手框樣式
    gamerBox: dark ? DARK_MODE_STYLES.gamerBoxDark : 'h-full flex items-center justify-center text-sm font-medium px-1',
    gamerBoxLeft: dark ? DARK_MODE_STYLES.gamerBoxLeftDark : 'border-r border-gray-300',
    gamerBoxWinner: dark ? DARK_MODE_STYLES.gamerBoxWinnerDark : 'bg-yellow-100 border-orange-400',
    gamerBoxEmpty: dark ? DARK_MODE_STYLES.gamerBoxEmptyDark : 'text-gray-400 bg-gray-50',
    gamerBoxDisabled: dark ? DARK_MODE_STYLES.gamerBoxDisabledDark : 'bg-gray-100 text-gray-400',
    gamerBoxEditable: dark ? DARK_MODE_STYLES.gamerBoxEditableDark : 'bg-blue-50 border-blue-200',

    // 文字樣式
    championText: dark ? DARK_MODE_STYLES.championTextDark : 'text-black font-bold text-center truncate',
    roundTitleText: dark ? DARK_MODE_STYLES.roundTitleTextDark : 'text-gray-700 font-medium text-center px-2',
    championTitleText: dark ? DARK_MODE_STYLES.championTitleTextDark : 'text-black font-bold text-center px-2',
    gamerText: dark ? DARK_MODE_STYLES.gamerTextDark : 'truncate text-center',

    // 遊戲局數框樣式
    gamesBox: dark
      ? DARK_MODE_STYLES.gamesBoxDark
      : 'w-12 h-6 bg-gray-100 border border-gray-300 rounded text-xs flex items-center justify-center',
    gamesBoxEdit: dark
      ? DARK_MODE_STYLES.gamesBoxEditDark
      : 'w-12 h-6 bg-white border border-blue-400 rounded text-xs flex items-center justify-center',

    // 編輯輸入框樣式
    editInputFocused: dark
      ? DARK_MODE_STYLES.editInputFocusedDark
      : 'w-full h-full text-center border-2 border-blue-500 rounded bg-blue-50 text-blue-700 font-bold outline-none px-1',
  };
};

// 獲取適當的顏色
export const getThemedColors = () => {
  const dark = isDarkMode();
  return dark
    ? DARK_MODE_COLORS
    : {
        canvasBackground: '#363636',
        stroke: '#d1d5db',
        highlight: '#f97316',
        text: '#000000',
        winnerHighlight: '#fef3c7',
        championBackground: '#ffd700',
        emptySlot: '#f9fafb',
        disabled: '#f3f4f6',
        disabledText: '#9ca3af',
        connectionLine: '#f97316',
      };
};
