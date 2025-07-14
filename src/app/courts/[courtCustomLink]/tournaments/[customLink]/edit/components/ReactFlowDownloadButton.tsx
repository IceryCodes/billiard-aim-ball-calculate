import React, { ReactElement } from 'react';

import { getNodesBounds, getViewportForBounds, Panel, useReactFlow, Viewport } from '@xyflow/react';
import { toPng } from 'html-to-image';

// 下載設定介面
interface DownloadConfig {
  fileName: string;
  imageWidth: number;
  imageHeight: number;
  backgroundColor: string;
  minZoom: number;
  maxZoom: number;
  padding: number;
}

// 預設下載設定
const DEFAULT_CONFIG: DownloadConfig = {
  fileName: 'reactflow.png',
  imageWidth: 1920,
  imageHeight: 1080,
  backgroundColor: '#1F2937',
  minZoom: 0.5,
  maxZoom: 2,
  padding: 0.1,
};

// 下載圖片函數
function downloadImage(dataUrl: string, fileName: string = DEFAULT_CONFIG.fileName): void {
  const link = document.createElement('a');
  link.setAttribute('download', fileName);
  link.setAttribute('href', dataUrl);
  link.click();
}

// 組件 Props 介面
interface DownloadButtonProps {
  config?: Partial<DownloadConfig>;
  className?: string;
  buttonTextElement?: React.ReactNode;
  title?: string;
}

// 主要組件
const DownloadButton = ({
  config = {},
  className = 'px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded text-xs text-blue-600',
  buttonTextElement = '下載成圖片',
  title = process.env.NEXT_PUBLIC_SITENAME,
}: DownloadButtonProps): ReactElement => {
  const { getNodes } = useReactFlow();

  // 合併配置
  const finalConfig: DownloadConfig = { ...DEFAULT_CONFIG, ...config };

  const handleDownload = async (): Promise<void> => {
    try {
      // 獲取所有節點的邊界
      const nodesBounds = getNodesBounds(getNodes());

      // 計算視窗變換以確保所有節點都可見
      const viewport: Viewport = getViewportForBounds(
        nodesBounds,
        finalConfig.imageWidth,
        finalConfig.imageHeight,
        finalConfig.minZoom,
        finalConfig.maxZoom,
        finalConfig.padding
      );

      // 獲取 React Flow 視窗元素
      const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement | null;

      if (!viewportElement) {
        console.error('React Flow viewport element not found');
        return;
      }

      // 生成圖片
      const dataUrl: string = await toPng(viewportElement, {
        backgroundColor: finalConfig.backgroundColor,
        width: finalConfig.imageWidth,
        height: finalConfig.imageHeight,
        style: {
          width: `${finalConfig.imageWidth}px`,
          height: `${finalConfig.imageHeight}px`,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        },
      });

      // 下載圖片
      downloadImage(dataUrl, title);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <Panel position="top-right">
      <button className={className} onClick={handleDownload} type="button" aria-label="Download flow diagram as image">
        {buttonTextElement}
      </button>
    </Panel>
  );
};

export default DownloadButton;
