import { Collection } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps } from '@/domains/court';
import { getCourtsCollection } from '@/lib/mongodb';
import { CourtUpdateReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { isAdminToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse<CourtUpdateReturnType>) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(HttpStatus.MethodNotAllowed).json({ message: `Method ${req.method} not allowed` });
  }

  try {
    const isAdmin = await isAdminToken(req.headers.authorization);
    if (!isAdmin) return res.status(HttpStatus.Forbidden).json({ message: 'Insufficient permissions' });
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(HttpStatus.Unauthorized).json({ message: 'Invalid token' });
  }

  const requiredFields = Object.keys({} as CourtDBProps) as (keyof CourtDBProps)[];
  for (const field of requiredFields) {
    if (req.body[field] === undefined) return res.status(HttpStatus.BadRequest).json({ message: `缺少所需資訊: ${field}` });
  }

  try {
    const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();

    const newCourt: CourtDBProps = {
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await courtsCollection.insertOne(newCourt);

    if (result.insertedId) {
      return res.status(HttpStatus.Created).json({ message: `已新增${newCourt.title}!` });
    } else {
      return res.status(HttpStatus.InternalServerError).json({ message: '新增撞球場地失敗!' });
    }
  } catch (error) {
    console.error('Error creating court:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
