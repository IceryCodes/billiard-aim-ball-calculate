import { Collection, ObjectId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps } from '@/domains/court';
import { getCourtsCollection } from '@/lib/mongodb';
import { HttpStatus } from '@/utils/api';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'POST') return res.status(HttpStatus.MethodNotAllowed).end();

  const { _id } = req.body;

  if (typeof _id !== 'string' || !ObjectId.isValid(_id)) {
    return res.status(HttpStatus.BadRequest).end();
  }

  try {
    const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();

    await courtsCollection.updateOne(
      {
        _id: new ObjectId(_id),
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      },
      {
        $inc: { viewed: 1 },
      },
      {
        upsert: true,
      }
    );

    res.status(HttpStatus.Ok).end().json({ message: `已更新瀏覽次數!` });
  } catch (error) {
    console.error('Error updating court view:', error);
    res.status(HttpStatus.InternalServerError).end();
  }
};

export default handler;
