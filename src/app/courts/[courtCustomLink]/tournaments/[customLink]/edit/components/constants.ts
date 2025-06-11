// ====== 基礎尺寸常數 ======
// 比賽選手框
export const boxWidth = 100;
export const boxHeight = 100;

// 冠軍框
export const championBoxWidth = 150;
export const championBoxHeight = 50;

// ====== 間距與佈局常數 ======
// 選手間距
export const playerSpacing = 110; // 第一輪選手之間的間距

// 輪次間距
export const roundHeight = 130; // 輪次之間的垂直間距

// 標題相關
export const headerHeight = 40; // 輪次標題高度
export const titleWidth = 180; // 輪次標題區域寬度
export const titlePadding = 8; // 標題內部間距

// 畫布邊距
export const canvasLeftPadding = 0; // 畫布左側間距
export const canvasRightPadding = 0; // 畫布右側間距
export const canvasBottomPadding = 60; // 畫布底部間距

// ====== 計算用常數 ======
// 選手框相關
export const halfBoxWidth = boxWidth / 2; // 選手框一半寬度（用於分割線）

// 冠軍相關位置
export const championTopMargin = titlePadding; // 冠軍框距離冠軍標題的間距
export const championToFinalGap = championBoxHeight; // 冠軍框到決賽框的間距

// 連接線相關
export const connectionLineWidth = 2; // 一般連接線寬度
export const championConnectionLineWidth = 3; // 冠軍連接線寬度
export const connectionLineColor = '#f97316'; // 連接線顏色

// QR Code 相關
export const qrCodeSize = 150; // QR Code 尺寸
export const qrCodeOffsetX = boxWidth; // QR Code X 軸偏移
export const qrCodeOffsetY = 0; // QR Code Y 軸偏移

// 文字相關
export const roundTitleFontSize = 30; // 輪次標題字體大小
export const championTitleFontSize = 30; // 冠軍標題字體大小
export const playerNameFontSize = 18; // 選手名稱字體大小
export const championNameFontSize = 20; // 冠軍名稱字體大小
export const lockIconFontSize = 16; // 鎖定圖標字體大小
export const crownIconFontSize = 16; // 皇冠圖標字體大小

// 邊框相關
export const defaultStrokeWidth = 1; // 預設邊框寬度
export const winnerStrokeWidth = 2; // 獲勝者內框寬度
export const championStrokeWidth = 3; // 冠軍框邊框寬度
export const outerStrokeWidth = 1; // 外框邊框寬度

// 顏色常數
export const strokeColor = '#d1d5db'; // 預設邊框顏色
export const highlightColor = '#f97316'; // 高亮顏色（橘色）
export const winnerHighlightColor = '#fef3c7'; // 獲勝者背景色
export const championBackgroundColor = '#ffd700'; // 冠軍背景色（金色）
export const emptySlotColor = '#f9fafb'; // 空位背景色
export const disabledColor = '#f3f4f6'; // 禁用狀態背景色
export const textColor = '#000000'; // 預設文字顏色
export const disabledTextColor = '#9ca3af'; // 禁用文字顏色

// ====== 動態計算輔助常數 ======
// 這些常數用於位置計算，避免在計算邏輯中出現魔術數字
export const matchHeight = boxHeight; // 比賽框高度（與 boxHeight 相同）
export const sceneHeightExtra = 40; // 場景額外高度

// 冠軍框皇冠圖標位置偏移
export const crownIconOffsetX = titlePadding * 3; // 皇冠圖標 X 軸偏移
export const championTextPaddingX = titlePadding; // 冠軍文字 X 軸內距
export const championTextWidth = championBoxWidth - titlePadding * 2; // 冠軍文字可用寬度

// 鎖定圖標位置
export const lockIconOffsetX = 20; // 鎖定圖標距離右邊框距離
export const lockIconOffsetY = 8; // 鎖定圖標距離中心點偏移

// 連接器相關
export const connectorHorizontalOffset = 10; // 連接器水平偏移量

// 縮放相關
export const initialScaleFactor = 0.8; // 初始縮放係數，用於確保完整賽程表可見

// 標準視角（1920x1080 視窗）
export const optimalScale = 0.7106813301301212; // 最佳縮放比例
export const optimalPositionX = 28.994444969904748; // 最佳 X 位置
export const optimalPositionY = 21.041842518751537; // 最佳 Y 位置

// 全螢幕視角
export const fullscreenScale = 0.9070294784580497; // 全螢幕縮放比例
export const fullscreenPositionX = 33.239465842510185; // 全螢幕 X 位置
export const fullscreenPositionY = 89.09969158521102; // 全螢幕 Y 位置

// 縮放控制
export const zoomStep = 0.005; // 縮放步長
export const minZoom = 0.1; // 最小縮放
export const maxZoom = 3; // 最大縮放
