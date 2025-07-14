import { ImageUploadDto } from '@/domains/image';
import { apiOrigin, logApiError } from '@/utils/api';

import { ImageUploadReturnType } from './interfaces';

export const uploadImage = async ({ folder, base64Image }: ImageUploadDto): Promise<ImageUploadReturnType> => {
  try {
    // 檢查 base64Image 格式
    if (!base64Image.startsWith('data:image/')) {
      throw new Error('Invalid image format');
    }

    // 使用後端 API route，而不是直接呼叫外部 API
    const res = await apiOrigin.post('/upload-image', {
      folder,
      base64Image,
    });

    if (res.data.success && res.data.filename) {
      return {
        success: true,
        filename: res.data.filename,
        imageUrl: res.data.imageUrl,
      };
    } else {
      throw new Error(res.data.error || '上傳失敗');
    }
  } catch (error) {
    const message = '圖片上傳失敗!';

    console.error('❌ 上傳失敗:', error);
    logApiError({ error, message });

    return {
      success: false,
      error: message,
    };
  }
};
