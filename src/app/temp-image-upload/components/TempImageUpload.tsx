'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

interface UploadSuccessResult {
  success: true;
  text: string;
  confidence: number;
}

interface UploadErrorResult {
  success: false;
  error: string;
}

type UploadResult = UploadSuccessResult | UploadErrorResult;
type InputMode = 'select' | 'camera' | 'file' | 'text';

const TempImageUpload: React.FC = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [inputMode, setInputMode] = useState<InputMode>('select');
  const [uploading, setUploading] = useState<boolean>(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用原生 URL API 獲取參數
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get('id');
      setSessionId(id);
      setIsReady(true);
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      alert('請選擇圖片文件');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!sessionId) return;

    // 檢查是否有內容要提交
    if (inputMode === 'text' && !textInput.trim()) {
      alert('請輸入文字內容');
      return;
    }
    if ((inputMode === 'camera' || inputMode === 'file') && !file) {
      alert('請選擇圖片');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('sessionId', sessionId);

    // 根據輸入模式添加對應的數據
    if (inputMode === 'text') {
      formData.append('directText', textInput.trim());
    } else if (file) {
      formData.append('image', file);
    }

    try {
      const response = await fetch('/api/upload-ocr', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResult = await response.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => {
          window.close();
        }, 2000);
      }
    } catch (error) {
      console.error('提交錯誤:', error);
      setResult({ success: false, error: '提交失敗' });
    } finally {
      setUploading(false);
    }
  };

  const resetToSelection = (): void => {
    setInputMode('select');
    setFile(null);
    setTextInput('');
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
  };

  // 清理預覽 URL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow">
          <div>載入中...</div>
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow">
          <div className="text-red-500">無效的連結</div>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white p-6 rounded shadow max-w-md w-full">
          {result.success ? (
            <div>
              <div className="text-green-600 font-medium mb-4">
                {result.confidence === 100 ? '文字已提交' : `識別完成 (${result.confidence.toFixed(1)}%)`}
              </div>
              <pre className="whitespace-pre-wrap text-sm p-3 rounded border max-h-48 overflow-auto">{result.text}</pre>
              <div className="mt-4 text-sm text-gray-500">2秒後自動關閉...</div>
            </div>
          ) : (
            <div>
              <div className="text-red-600 font-medium mb-2">處理失敗</div>
              <div className="text-sm text-gray-600">{result.error}</div>
              <button onClick={() => setResult(null)} className="mt-4 px-4 py-2 text-white rounded">
                重試
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-6 rounded shadow max-w-md w-full">
        <h1 className="text-lg font-medium mb-4">圖片文字識別</h1>

        {/* 拍照輸入 - 強制使用相機 */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 選擇文件輸入 - 可以選擇相簿 */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        {inputMode === 'select' && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setInputMode('camera');
                cameraInputRef.current?.click();
              }}
              className="w-full px-4 py-3 text-white rounded flex items-center justify-center gap-2"
            >
              📸 拍照識別
            </button>
            <button
              onClick={() => {
                setInputMode('file');
                fileInputRef.current?.click();
              }}
              className="w-full px-4 py-3 text-white rounded flex items-center justify-center gap-2"
            >
              🖼️ 選擇相簿圖片
            </button>
            <button
              onClick={() => setInputMode('text')}
              className="w-full px-4 py-3 text-white rounded flex items-center justify-center gap-2"
            >
              ✏️ 直接輸入文字
            </button>
          </div>
        )}

        {(inputMode === 'camera' || inputMode === 'file') && file && (
          <div>
            {preview && (
              <Image
                src={preview}
                alt={`${process.env.NEXT_PUBLIC_SITENAME} 名單導入QR code`}
                width={500}
                height={500}
                className="w-full mb-4 rounded border max-h-64 object-contain"
                placeholder="blur"
                blurDataURL={preview}
              />
            )}
            <div className="space-y-3">
              <button onClick={handleSubmit} disabled={uploading} className="w-full px-4 py-3 text-white rounded">
                {uploading ? '處理中...' : '開始識別'}
              </button>
              <button onClick={resetToSelection} className="w-full px-4 py-3 text-white rounded">
                重新選擇
              </button>
            </div>
          </div>
        )}

        {inputMode === 'text' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">輸入報名名單或其他文字內容：</label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="例如：&#10;7/14 夜光盃 19:00開賽（9號球）&#10;報名以下請接龍&#10;1：陳豐其&#10;2：朴孝律（韓國女選手）&#10;..."
              className="w-full h-64 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={12}
            />
            <div className="space-y-3 mt-4">
              <button
                onClick={handleSubmit}
                disabled={uploading || !textInput.trim()}
                className="w-full px-4 py-3 text-white rounded"
              >
                {uploading ? '提交中...' : '提交文字'}
              </button>
              <button onClick={resetToSelection} className="w-full px-4 py-3 text-white rounded">
                返回選擇
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TempImageUpload;
