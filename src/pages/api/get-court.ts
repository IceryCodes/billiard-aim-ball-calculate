import { Collection, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps, CourtProps } from '@/domains/court';
import { getCourtsCollection } from '@/lib/mongodb';
import { GetCourtReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { getManagePlayerRecordsByCategoryId } from '@/utils/apiFunctions';

// 球場資料幾乎不會變(專案已停止維護)→ CDN 快取 1 天、過期後先回舊資料再背景更新。
// 回應不含使用者個人資料(manage 只看這個球場有沒有管理者),所以可以共用快取。
export const config = { maxDuration: 10 };

const CACHE_CONTROL = 'public, s-maxage=86400, stale-while-revalidate=604800';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetCourtReturnType>) => {
  const { customLink } = req.query;

  if (typeof customLink !== 'string') {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();

    const court: WithId<CourtDBProps> | null = await courtsCollection.findOne({
      customLink: decodeURIComponent(customLink),
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });

    const manage = !!(
      court &&
      (await getManagePlayerRecordsByCategoryId({
        id: court._id,
      }))
    );

    const courtData: CourtProps | null = court?._id ? { ...court, _id: court._id.toString() } : null;

    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.status(HttpStatus.Ok).json({ court: courtData, manage, message: 'Success' });
  } catch (error) {
    console.error('Error fetching court by ID:', error);
    res.status(HttpStatus.InternalServerError).json({ message: '伺服器發生錯誤，請稍後再試。' });
  }
};

export default handler;
