import { Collection, ObjectId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps } from '@/domains/court';
import { getCourtsCollection } from '@/lib/mongodb';
import { HttpStatus } from '@/utils/api';
import { isAdminToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(HttpStatus.MethodNotAllowed).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const isAdmin = await isAdminToken(req.headers.authorization);
    if (!isAdmin) return res.status(HttpStatus.Forbidden).json({ message: 'Insufficient permissions' });
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(HttpStatus.Unauthorized).json({ message: 'Invalid token' });
  }

  if (typeof req.body._id !== 'string' || !ObjectId.isValid(req.body._id))
    return res.status(HttpStatus.BadRequest).json({ message: '刪除撞球場地失敗!' });

  try {
    const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();
    const court = await courtsCollection.findOne({
      _id: new ObjectId(req.body._id as string),
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });
    if (!court) return res.status(HttpStatus.NotFound).json({ message: '撞球場地不存在' });

    const result = await courtsCollection.updateOne(
      { _id: new ObjectId(req.body._id as string) },
      { $set: { deletedAt: new Date() } }
    );

    if (result.modifiedCount === 0) {
      return res.status(HttpStatus.NotFound).json({ message: '撞球場地不存在!' });
    }

    res.status(HttpStatus.Ok).json({ message: `已刪除${court.title}!` });
  } catch (error) {
    console.error('Error soft deleting court:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
