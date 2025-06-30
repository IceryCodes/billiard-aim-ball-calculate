import { Collection, ObjectId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { ManageDBProps } from '@/domains/manage';
import { PlayerDBProps } from '@/domains/player';
import { getPlayerManagesCollection, getPlayersCollection } from '@/lib/mongodb';
import { HttpStatus } from '@/utils/api';
import { isAdminToken, verifyToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return res.status(HttpStatus.MethodNotAllowed).json({ message: `Method ${req.method} not allowed` });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.error('Unauthorized');
    return res.status(HttpStatus.Unauthorized).json({ message: 'Unauthorized' });
  }

  const { user } = await verifyToken({ token });

  try {
    const isAdmin = await isAdminToken(req.headers.authorization);
    if (!isAdmin) return res.status(HttpStatus.Forbidden).json({ message: 'Insufficient permissions' });
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(HttpStatus.Unauthorized).json({ message: 'Invalid token' });
  }

  if (typeof req.body._id !== 'string' || !ObjectId.isValid(req.body._id))
    return res.status(HttpStatus.BadRequest).json({ message: '刪除撞球選手失敗!' });

  try {
    const playersCollection: Collection<PlayerDBProps> = await getPlayersCollection();
    const playerManagesCollection: Collection<ManageDBProps> = await getPlayerManagesCollection();

    const player = await playersCollection.findOne({
      _id: new ObjectId(req.body._id as string),
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });
    if (!player) return res.status(HttpStatus.NotFound).json({ message: '撞球選手不存在' });

    // 先刪除當前用戶的 manage 記錄
    const deleteManagesResult = await playerManagesCollection.deleteMany({
      userId: user._id,
      itemId: req.body._id,
    });

    // 檢查是否還有其他用戶在 manage 這個 player
    const remainingManages = await playerManagesCollection.countDocuments({
      itemId: req.body._id,
    });

    let playerDeleted = false;
    let message = `已移除${player.title}的${deleteManagesResult.deletedCount}筆管理權限!`;

    // 如果沒有其他用戶管理這個 player，則軟刪除 player
    if (remainingManages === 0) {
      const result = await playersCollection.updateOne(
        { _id: new ObjectId(req.body._id as string) },
        { $set: { deletedAt: new Date() } }
      );

      if (result.modifiedCount > 0) {
        playerDeleted = true;
        message = `已刪除${player.title}以及${deleteManagesResult.deletedCount}筆管理權限!`;
      }
    }

    res.status(HttpStatus.Ok).json({
      message,
      playerDeleted,
      deletedManages: deleteManagesResult.deletedCount,
      remainingManages,
    });
  } catch (error) {
    console.error('Error soft deleting player:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
