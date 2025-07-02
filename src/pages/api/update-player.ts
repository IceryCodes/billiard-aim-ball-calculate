import { Collection, ObjectId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { PlayerDBProps } from '@/domains/player';
import { getPlayersCollection } from '@/lib/mongodb';
import { PlayerUpdateReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { isManagerToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse<PlayerUpdateReturnType>) => {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(HttpStatus.MethodNotAllowed).json({ message: `Method ${req.method} not allowed` });
  }

  // Create an array of keys from PlayerDBProps
  const requiredFields = Object.keys({} as PlayerDBProps) as (keyof PlayerDBProps)[];

  for (const field of requiredFields) {
    if (req.body[field] === undefined) return res.status(HttpStatus.BadRequest).json({ message: `缺少所需資訊: ${field}` });
  }

  if (typeof req.body._id !== 'string' || !ObjectId.isValid(req.body._id))
    return res.status(HttpStatus.BadRequest).json({ message: '更新撞球選手失敗!' });

  try {
    const playersCollection: Collection<PlayerDBProps> = await getPlayersCollection();
    const playerId = new ObjectId(req.body._id as string);
    const updateFields = req.body;

    delete updateFields._id;

    const updateData: Partial<PlayerDBProps> = {
      ...req.body,
      createdAt: new Date(req.body.createdAt),
      updatedAt: new Date(),
    };

    // Fetch the current player data to check title
    const currentPlayer = await playersCollection.findOne({ _id: playerId });

    if (!currentPlayer) {
      return res.status(HttpStatus.NotFound).json({ message: '撞球選手不存在!' });
    }

    const isManager = await isManagerToken({
      authHeader: req.headers.authorization,
      pageId: playerId.toString(),
    });
    if (!isManager) return res.status(HttpStatus.Forbidden).json({ message: '沒有管理權限!' });

    // Update the player information
    const result = await playersCollection.updateOne(
      { _id: playerId, $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
      {
        $set: updateData,
      }
    );

    if (result.modifiedCount === 0) return res.status(HttpStatus.NotFound).json({ message: '撞球選手不存在!' });

    res.status(HttpStatus.Ok).json({ message: `已更新${updateData.title}!` });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
