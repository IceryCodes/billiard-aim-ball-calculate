import React, { ChangeEvent, useState } from 'react';

import Image from 'next/image';
import { Control, Controller } from 'react-hook-form';

import { UpdatePlayerProps } from '@/domains/player';
import { useImageUploadMutation } from '@/features/useImageUploadMutation';

interface ImageUploadProps {
  control: Control<UpdatePlayerProps>;
  defaultImage?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'] as const;

type AllowedMimeType = (typeof ALLOWED_TYPES)[number];

interface ImageCompressionResult {
  blob: Blob;
  width: number;
  height: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ control, defaultImage }) => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string>(defaultImage || '');

  const { isLoading: isUploading, mutateAsync: uploadImageMutation } = useImageUploadMutation({
    onError: (error) => {
      setError(error.message);
    },
  });

  const compressImage = async (file: File): Promise<ImageCompressionResult> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);

      reader.onload = (event: ProgressEvent<FileReader>) => {
        const img = document.createElement('img');

        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width * MAX_HEIGHT) / height);
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('無法創建 canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  blob,
                  width,
                  height,
                });
              } else {
                reject(new Error('圖片壓縮失敗'));
              }
            },
            'image/jpeg',
            0.8
          );
        };

        img.onerror = () => reject(new Error('圖片載入失敗'));

        const result = event.target?.result;
        img.src = typeof result === 'string' ? result : '';
      };

      reader.onerror = () => reject(new Error('檔案讀取失敗'));
    });
  };

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type as AllowedMimeType)) {
      setError('只接受JPG或PNG格式的圖片');
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('圖片大小不能超過 5MB');
      return false;
    }

    return true;
  };

  const handleImageUpload = async (file: File, onChange: (value: string) => void): Promise<void> => {
    try {
      setError('');
      setUploadProgress(0);

      if (!validateFile(file)) {
        return;
      }

      const { blob: compressedImage } = await compressImage(file);

      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedImage);
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            resolve(result);
          } else {
            reject(new Error('無法轉換圖片格式'));
          }
        };
        reader.onerror = () => reject(new Error('檔案讀取失敗'));
      });

      const response = await uploadImageMutation({ folder: process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER, base64Image });

      if (response.success && response.filename) {
        const url = `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${response.filename}`;
        setPreview(url);
        onChange(response.filename);
      } else {
        throw new Error(response.error || '上傳失敗');
      }

      setUploadProgress(100);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '上傳過程發生錯誤';
      setError(errorMessage);
      console.error('Image upload error:', err);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, onChange: (value: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file, onChange);
    }
  };

  return (
    <div className="space-y-4">
      <Controller
        name="featuredImg"
        control={control}
        render={({ field: { onChange }, fieldState: { error: fieldError } }) => (
          <div className="space-y-4">
            <input
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={(e) => handleFileChange(e, onChange)}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0 file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            {(error || fieldError) && <p className="text-red-500 text-sm">{error || fieldError?.message}</p>}
            {preview && (
              <div className="relative w-full h-48">
                <Image src={preview} alt="Preview" fill className="object-cover rounded-lg" />
              </div>
            )}
          </div>
        )}
      />
    </div>
  );
};
