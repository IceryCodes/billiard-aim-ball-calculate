import type { NextApiRequest, NextApiResponse } from 'next';

import { GoogleBusinessStatus } from '@/domains/google';
import { GetGoogleInfosReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

// Google Maps / Places 金鑰已撤銷、不會再換新金鑰 → 這支不再呼叫任何外部 API,
// 一律立即回空結果。前端已不再呼叫,保留路由只是讓舊快取的頁面 / 爬蟲拿到 200 而不是錯誤。
// 回應固定不變 → 讓 CDN 長時間快取,幾乎不會再進到 function。
export const config = { maxDuration: 5 };

const EMPTY_GOOGLE_INFOS: GetGoogleInfosReturnType = {
  address_components: [],
  adr_address: '',
  business_status: GoogleBusinessStatus.Operational,
  formatted_address: '',
  formatted_phone_number: '',
  geometry: null,
  icon: '',
  icon_background_color: '',
  icon_mask_base_uri: '',
  international_phone_number: '',
  name: '',
  opening_hours: null,
  photos: [],
  place_id: '',
  plus_code: null,
  types: [],
  url: '',
  utc_offset: 0,
  vicinity: '',
  website: '',
  price_level: null,
  rating: 0,
  reviews: [],
  user_ratings_total: 0,
  scope: '',
  permanently_closed: false,
  reservable: false,
  serves_beer: false,
  serves_breakfast: false,
  serves_brunch: false,
  serves_dinner: false,
  serves_lunch: false,
  serves_vegetarian_food: false,
  takeout: false,
};

const handler = (req: NextApiRequest, res: NextApiResponse<GetGoogleInfosReturnType | { error: string }>) => {
  if (req.method !== 'GET') return res.status(HttpStatus.MethodNotAllowed).json({ error: 'Method not allowed' });

  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=2592000');
  return res.status(HttpStatus.Ok).json(EMPTY_GOOGLE_INFOS);
};

export default handler;
