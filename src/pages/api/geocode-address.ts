import type { NextApiRequest, NextApiResponse } from 'next';

import { GeocodeAddressReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

// Google Geocoding 金鑰已撤銷、不會再換新金鑰 → 不再呼叫外部 API,一律立即回 410。
// 前端(CourtForm 新增模式)拿不到座標就會提示「目前無法新增撞球場地」。
export const config = { maxDuration: 5 };

const handler = (req: NextApiRequest, res: NextApiResponse<GeocodeAddressReturnType>) => {
  if (req.method !== 'POST') {
    return res.status(HttpStatus.MethodNotAllowed).json({ message: 'Method not allowed' });
  }

  return res.status(HttpStatus.Gone).json({ message: '地址自動定位已停用，目前無法新增撞球場地。' });
};

export default handler;
