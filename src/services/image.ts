import axios from 'axios';

import { ImageUploadDto } from '@/domains/image';
import { apiIcery, HttpStatus, logApiError } from '@/utils/api';

import { ImageUploadReturnType } from './interfaces';

export const uploadImage = async ({ folder, base64Image }: ImageUploadDto): Promise<ImageUploadReturnType> => {
  try {
    // 檢查 base64Image 格式
    if (!base64Image.startsWith('data:image/')) {
      throw new Error('Invalid image format');
    }

    const res = await apiIcery.post(
      '/image/upload',
      { folder, file: base64Image },
      {
        timeout: 30000, // 30 秒超時
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: res.status === HttpStatus.Ok,
      filename: res.data.data.filename,
    };
  } catch (error) {
    let message = '圖片上傳失敗!';
    logApiError({ error, message });

    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        message = '上傳超時，請稍後再試';
      } else if (error.response?.status === HttpStatus.Unauthorized) {
        message = '驗證失敗，請重新登入';
      } else if (error.response?.status === HttpStatus.Forbidden) {
        message = '沒有權限上傳圖片';
      }
      console.error('Upload error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers,
      });
    }

    return {
      success: false,
      error: message,
    };
  }
};
