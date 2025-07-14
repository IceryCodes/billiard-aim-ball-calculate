import https from 'https';

import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

import { HttpStatus } from '@/utils/api';
import { verifyToken } from '@/utils/token';

interface UploadImageRequest {
  folder: string;
  base64Image: string;
}

interface UploadImageResponse {
  success: boolean;
  filename?: string;
  imageUrl?: string;
  error?: string;
}

const handler = async (req: NextApiRequest, res: NextApiResponse<UploadImageResponse>) => {
  if (req.method !== 'POST') {
    return res.status(HttpStatus.MethodNotAllowed).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  // 驗證用戶身份
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.error('Unauthorized - No token provided');
    return res.status(HttpStatus.Unauthorized).json({
      success: false,
      error: 'Unauthorized',
    });
  }

  const { user } = await verifyToken({ token });
  if (!user) {
    console.error('User not found');
    return res.status(HttpStatus.NotFound).json({
      success: false,
      error: '帳號不存在!',
    });
  }

  const { folder, base64Image }: UploadImageRequest = req.body;

  // 驗證請求數據
  if (!folder || !base64Image) {
    return res.status(HttpStatus.BadRequest).json({
      success: false,
      error: '缺少必要參數',
    });
  }

  // 檢查 base64Image 格式
  if (!base64Image.startsWith('data:image/')) {
    return res.status(HttpStatus.BadRequest).json({
      success: false,
      error: 'Invalid image format',
    });
  }

  try {
    // 重試機制來處理 Render.com 冷啟動問題
    const maxRetries = 3;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `${process.env.ICERY_API_URL}/image/upload`,
          {
            folder,
            file: base64Image,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': process.env.ICERY_API_KEY,
              Accept: 'application/json',
              Origin: process.env.NEXT_PUBLIC_BASE_URL,
              'X-Requested-With': 'XMLHttpRequest',
              'User-Agent': 'Billiards-App/1.0',
            },
            timeout: 45000, // 增加到 45 秒
            // 開發環境下允許自簽名證書
            httpsAgent: process.env.NODE_ENV === 'development' ? new https.Agent({ rejectUnauthorized: false }) : undefined,
          }
        );

        if (response.status === HttpStatus.Ok && response.data.data?.filename) {
          return res.status(HttpStatus.Ok).json({
            success: true,
            filename: response.data.data.filename,
            imageUrl: response.data.data.imageUrl,
          });
        } else {
          throw new Error(response.data.message || '上傳失敗');
        }
      } catch (error) {
        lastError = error;

        // 如果是 503 錯誤且還有重試機會，則等待後重試
        if (axios.isAxiosError(error) && error.response?.status === 503 && attempt < maxRetries) {
          const waitTime = attempt * 2000; // 2秒, 4秒, 6秒
          console.error(`⏰ 收到 503 錯誤，等待 ${waitTime}ms 後重試...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        // 如果不是 503 錯誤，或已用完重試次數，則拋出錯誤
        throw error;
      }
    }

    // 如果所有重試都失敗，拋出最後一個錯誤
    throw lastError;
  } catch (error) {
    console.error('❌ 圖片上傳錯誤:', error);

    let errorMessage = '圖片上傳失敗';
    let statusCode = HttpStatus.InternalServerError;

    if (axios.isAxiosError(error)) {
      console.error('API 錯誤詳情:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers,
        url: error.config?.url,
        method: error.config?.method,
      });

      switch (error.response?.status) {
        case 503:
          errorMessage = '外部服務暫時不可用，請稍後再試 (可能是服務正在啟動中)';
          statusCode = HttpStatus.BadRequest;
          break;
        case 502:
          errorMessage = '外部服務連接失敗，請稍後再試';
          statusCode = HttpStatus.BadRequest;
          break;
        case 504:
          errorMessage = '外部服務響應超時，請稍後再試';
          statusCode = HttpStatus.BadRequest;
          break;
        case HttpStatus.Unauthorized:
          errorMessage = 'API 驗證失敗';
          statusCode = HttpStatus.Unauthorized;
          break;
        case HttpStatus.Forbidden:
          errorMessage = 'API 權限不足';
          statusCode = HttpStatus.Forbidden;
          break;
        case HttpStatus.NotFound:
          errorMessage = 'API 端點不存在';
          statusCode = HttpStatus.BadRequest;
          break;
        case 413:
          errorMessage = '圖片太大，請選擇較小的圖片';
          statusCode = HttpStatus.BadRequest;
          break;
        default:
          if (error.code === 'ECONNABORTED') {
            errorMessage = '上傳超時，請稍後再試';
            statusCode = HttpStatus.BadRequest;
          } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorMessage = '無法連接到外部服務，請稍後再試';
            statusCode = HttpStatus.BadRequest;
          }
          break;
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
    });
  }
};

export default handler;
