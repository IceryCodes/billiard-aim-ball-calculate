export const runtime = 'nodejs';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { GeocodeAddressReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse<GeocodeAddressReturnType>) {
  if (req.method !== 'POST') {
    return res.status(HttpStatus.MethodNotAllowed).json({ message: 'Method not allowed' });
  }

  const { fullAddress } = req.body;
  console.info('Geocoding address:', req.body);

  if (!fullAddress || typeof fullAddress !== 'string') {
    return res.status(HttpStatus.BadRequest).json({ message: 'Address is required' });
  }

  if (!process.env.GOOGLE_API_PLACE_KEY) {
    return res.status(HttpStatus.InternalServerError).json({ message: 'Google API key not configured' });
  }

  try {
    // 使用 Google Geocoding API
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: fullAddress,
        key: process.env.GOOGLE_API_PLACE_KEY,
        language: 'zh-TW', // 繁體中文
        region: 'tw', // 台灣地區
      },
    });

    const data = response.data;

    // 檢查 API 響應狀態
    if (data.status !== 'OK') {
      console.error('Geocoding API error:', data.status, data.error_message);

      switch (data.status) {
        case 'ZERO_RESULTS':
          return res.status(HttpStatus.NotFound).json({
            message: '找不到該地址的位置資訊',
          });
        case 'OVER_DAILY_LIMIT':
        case 'OVER_QUERY_LIMIT':
          return res.status(HttpStatus.TooManyRequests).json({
            message: 'API 請求限制已達上限，請稍後再試',
          });
        case 'REQUEST_DENIED':
          return res.status(HttpStatus.Forbidden).json({
            message: 'API 請求被拒絕',
          });
        case 'INVALID_REQUEST':
          return res.status(HttpStatus.BadRequest).json({
            message: '無效的地址格式',
          });
        default:
          return res.status(HttpStatus.InternalServerError).json({
            message: '地理編碼服務暫時無法使用',
          });
      }
    }

    // 檢查是否有結果
    if (!data.results || data.results.length === 0) {
      return res.status(HttpStatus.NotFound).json({
        message: '無法找到該地址的座標資訊',
      });
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    console.info('Geocoding successful:', { lat, lng, formatted_address: result.formatted_address });

    // 返回座標（GeoJSON 格式：[經度, 緯度]）
    return res.status(HttpStatus.Ok).json({
      coordinates: [lng, lat],
      formatted_address: result.formatted_address,
      message: '地址轉換成功',
    });
  } catch (error) {
    console.error('Geocoding API error:', error);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 403) {
        return res.status(HttpStatus.Forbidden).json({
          message: 'Google API 金鑰無效或權限不足',
        });
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return res.status(HttpStatus.InternalServerError).json({
          message: '無法連接到地理編碼服務',
        });
      }
    }

    return res.status(HttpStatus.InternalServerError).json({
      message: '地址轉換服務發生錯誤，請稍後再試',
    });
  }
}
