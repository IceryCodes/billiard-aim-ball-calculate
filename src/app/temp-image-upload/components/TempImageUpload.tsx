'use client';

import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import { Button } from '@/global-components/buttons/Button';
import Card from '@/global-components/Card';

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
        <Card>
          <div>載入中...</div>
        </Card>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <div className="text-red-500">無效的連結</div>
        </Card>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full">
          {result.success ? (
            <div>
              <div className="text-green-600 font-medium mb-4">
                {result.confidence === 100 ? '文字已提交' : `識別完成 (${result.confidence.toFixed(1)}%)`}
              </div>
              <pre className="whitespace-pre-wrap text-sm p-3 rounded border max-h-48 overflow-auto">{result.text}</pre>
              <div className="mt-4 text-sm">2秒後自動關閉...</div>
            </div>
          ) : (
            <div>
              <div className="text-red-600 font-medium mb-2">處理失敗</div>
              <div className="text-sm">{result.error}</div>
              <Button text="重試" onClick={() => setResult(null)} className="mt-4" />
            </div>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="max-w-md w-full">
        <h1 className="text-lg font-medium mb-4">圖片文字識別</h1>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

        {inputMode === 'select' && (
          <div className="space-y-3">
            <Button text="✏️ 直接輸入文字" onClick={() => setInputMode('text')} className="w-full" />
            <Button
              text="🖼️ 選擇相簿圖片"
              onClick={() => {
                setInputMode('file');
                fileInputRef.current?.click();
              }}
              className="w-full"
            />
            <Button
              text="📸 拍照識別"
              onClick={() => {
                setInputMode('camera');
                cameraInputRef.current?.click();
              }}
              className="w-full"
            />
          </div>
        )}

        {(inputMode === 'camera' || inputMode === 'file') && (
          <div>
            {preview && file && (
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
              {file && (
                <Button
                  text={uploading ? '處理中...' : '開始識別'}
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="w-full"
                />
              )}
              <Button text="重新選擇" onClick={resetToSelection} className="w-full" />
            </div>
          </div>
        )}

        {inputMode === 'text' && (
          <div>
            <label className="block text-sm font-medium mb-2">輸入報名名單或其他文字內容：</label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`例如： (一位選手一行)\n選手一\n選手二\n...`}
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={12}
            />
            <div className="space-y-3 mt-4">
              <Button
                text={uploading ? '提交中...' : '提交文字'}
                onClick={handleSubmit}
                disabled={uploading || !textInput.trim()}
                className="w-full"
              />
              <Button text="返回選擇" onClick={resetToSelection} className="w-full" />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default TempImageUpload;
