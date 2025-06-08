import { Collection } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps } from '@/domains/court';
import { getCourtsMapCollection } from '@/lib/mongodb';
import { GetCourtsReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

const LIMIT = 30;
const MAX_DISTANCE_KM = 10; // 預設搜尋半徑（公里）

interface CourtQuery {
  location: {
    $near: {
      $geometry: {
        type: string;
        coordinates: number[];
      };
      $maxDistance: number;
    };
  };
  fullDay?: boolean;
  partner?: boolean;
}

const handler = async (req: NextApiRequest, res: NextApiResponse<GetCourtsReturnType>) => {
  if (req.method !== 'GET') {
    return res.status(HttpStatus.MethodNotAllowed).json({ message: '方法不允許' });
  }

  const { lat, lng, fullDay, partner, radius = MAX_DISTANCE_KM } = req.query;
  const userLat = parseFloat(lat as string);
  const userLng = parseFloat(lng as string);
  const searchRadius = parseFloat(radius as string);
  const isFullDay = fullDay === 'true'; // 轉換為布林值
  const isPartner = partner === 'true'; // 轉換為布林值

  // 驗證參數
  if (isNaN(userLat) || isNaN(userLng) || isNaN(searchRadius)) {
    return res.status(HttpStatus.BadRequest).json({ message: '無效的座標或半徑' });
  }

  try {
    const courtsCollection: Collection<CourtDBProps> = await getCourtsMapCollection();

    // 建立查詢條件
    const query: CourtQuery = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [userLng, userLat],
          },
          $maxDistance: searchRadius * 1000, // 轉換為公尺
        },
      },
    };

    // 如果需要24小時營業的撞球場地
    if (isFullDay) query.fullDay = true;

    // 如果需要合作夥伴撞球場地
    if (isPartner) query.partner = true;

    const courts = await courtsCollection.find(query).limit(LIMIT).toArray();

    const total = courts.length;

    res.status(HttpStatus.Ok).json({
      courts: courts.map((court) => ({
        ...court,
        _id: court._id.toString(),
      })),
      total,
      message: '成功',
    });
  } catch (error) {
    console.error('獲取附近撞球場地時發生錯誤:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `伺服器錯誤: ${error}` });
  }
};

export default handler;
