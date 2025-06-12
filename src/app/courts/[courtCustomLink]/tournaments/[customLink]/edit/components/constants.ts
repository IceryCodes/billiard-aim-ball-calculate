// ====== 基礎尺寸常數 ======
// 比賽選手框
export const boxWidth = 100;
export const boxHeight = 100;

// 冠軍框
export const championBoxWidth = 150;
export const championBoxHeight = 50;

// ====== 間距與佈局常數 ======
// 選手間距
export const playerSpacing = 110;

// 輪次間距
export const roundHeight = 130;

// 標題相關
export const headerHeight = 40;
export const titleWidth = 180;
export const titlePadding = 8;

// 畫布邊距
export const canvasLeftPadding = 0;
export const canvasRightPadding = 0;
export const canvasBottomPadding = 60;

// ====== 計算用常數 ======
// 選手框相關
export const halfBoxWidth = boxWidth / 2;

// 冠軍相關位置
export const championTopMargin = titlePadding;
export const championToFinalGap = championBoxHeight;

// 連接線相關
export const connectionLineWidth = 2;
export const championConnectionLineWidth = 3;
export const connectionLineColor = '#f97316';

// QR Code 相關
export const qrCodeSize = 150;
export const qrCodeOffsetX = boxWidth;
export const qrCodeOffsetY = 0;

// 文字相關
export const roundTitleFontSize = 30;
export const championTitleFontSize = 30;
export const playerNameFontSize = 18;
export const championNameFontSize = 20;
export const lockIconFontSize = 16;
export const crownIconFontSize = 16;

// 邊框相關
export const defaultStrokeWidth = 1;
export const winnerStrokeWidth = 2;
export const championStrokeWidth = 3;
export const outerStrokeWidth = 1;

// 顏色常數
export const strokeColor = '#d1d5db';
export const highlightColor = '#f97316';
export const winnerHighlightColor = '#fef3c7';
export const championBackgroundColor = '#ffd700';
export const emptySlotColor = '#f9fafb';
export const disabledColor = '#f3f4f6';
export const textColor = '#000000';
export const disabledTextColor = '#9ca3af';

// ====== 動態計算輔助常數 ======
export const matchHeight = boxHeight;
export const sceneHeightExtra = 40;

// 冠軍框皇冠圖標位置偏移
export const crownIconOffsetX = titlePadding * 3;
export const championTextPaddingX = titlePadding;
export const championTextWidth = championBoxWidth - titlePadding * 2;

// 鎖定圖標位置
export const lockIconOffsetX = 20;
export const lockIconOffsetY = 8;

// 連接器相關
export const connectorHorizontalOffset = 10;

// 縮放相關
export const initialScaleFactor = 0.8;

// 標準視角（1920x1080 視窗）
export const optimalScale = 0.7106813301301212;
export const optimalPositionX = 28.994444969904748;
export const optimalPositionY = 21.041842518751537;

// 全螢幕視角
export const fullscreenScale = 0.9070294784580497;
export const fullscreenPositionX = 33.239465842510185;
export const fullscreenPositionY = 89.09969158521102;

// 縮放控制
export const zoomStep = 0.005;
export const minZoom = 0.1;
export const maxZoom = 3;

// ====== 繪圖相關常數 ======
export enum DrawingMode {
  NORMAL = 'normal',
  DRAWING = 'drawing',
}

// 繪圖層級
export const mainLayerName = 'main';
export const drawingLayerName = 'drawing';

// 繪圖樣式
export const drawingStrokeWidth = 3;
export const drawingStrokeColor = '#ef4444';
export const drawingLineCap = 'round' as const;
export const drawingLineJoin = 'round' as const;