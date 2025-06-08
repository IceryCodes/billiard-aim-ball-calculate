import { Collection, ObjectId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps } from '@/domains/court';
import { getCourtsCollection } from '@/lib/mongodb';
import { CourtUpdateReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { isManagerToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse<CourtUpdateReturnType>) => {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(HttpStatus.MethodNotAllowed).json({ message: `Method ${req.method} not allowed` });
  }

  // Create an array of keys from CourtDBProps
  const requiredFields = Object.keys({} as CourtDBProps) as (keyof CourtDBProps)[];

  for (const field of requiredFields) {
    if (req.body[field] === undefined) return res.status(HttpStatus.BadRequest).json({ message: `缺少所需資訊: ${field}` });
  }

  if (typeof req.body._id !== 'string' || !ObjectId.isValid(req.body._id))
    return res.status(HttpStatus.BadRequest).json({ message: '更新撞球場地失敗!' });

  try {
    const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();
    const courtId = new ObjectId(req.body._id as string);
    const updateFields = req.body;

    delete updateFields._id;

    const updateData: Partial<CourtDBProps> = {
      ...req.body,
      fullDay: req.body.openTime === '00:00' && req.body.closeTime === '23:59',
      createdAt: new Date(req.body.createdAt),
      updatedAt: new Date(),
    };

    // Fetch the current court data to check title
    const currentCourt = await courtsCollection.findOne({ _id: courtId });

    if (!currentCourt) {
      return res.status(HttpStatus.NotFound).json({ message: '撞球場地不存在!' });
    }

    const isManager = await isManagerToken({
      authHeader: req.headers.authorization,
      pageId: courtId.toString(),
    });
    if (!isManager) return res.status(HttpStatus.Forbidden).json({ message: '沒有管理權限!' });

    // Update the court information
    const result = await courtsCollection.updateOne(
      { _id: courtId, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
      {
        $set: updateData,
      }
    );

    if (result.modifiedCount === 0) return res.status(HttpStatus.NotFound).json({ message: '撞球場地不存在!' });

    res.status(HttpStatus.Ok).json({ message: `已更新${updateData.title}!` });
  } catch (error) {
    console.error('Error updating court:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
