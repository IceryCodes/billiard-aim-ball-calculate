import { Collection, ObjectId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { ManageDBProps } from '@/domains/manage';
import { PlayerDBProps } from '@/domains/player';
import { generateUniqueCustomLink } from '@/features/tournaments/helper';
import { getPlayerManagesCollection, getPlayersCollection } from '@/lib/mongodb';
import { PlayerUpdateReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { verifyToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse<PlayerUpdateReturnType>) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(HttpStatus.MethodNotAllowed).json({ message: `Method ${req.method} not allowed` });
  }

  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.error('Unauthorized');
    return res.status(HttpStatus.Unauthorized).json({ message: 'Unauthorized' });
  }

  const { user } = await verifyToken({ token });

  if (!user) {
    console.error('User not found');
    return res.status(HttpStatus.NotFound).json({ message: '帳號不存在!' });
  }

  const requiredFields = Object.keys({} as PlayerDBProps) as (keyof PlayerDBProps)[];
  for (const field of requiredFields) {
    if (req.body[field] === undefined) return res.status(HttpStatus.BadRequest).json({ message: `缺少所需資訊: ${field}` });
  }

  try {
    const playersCollection: Collection<PlayerDBProps> = await getPlayersCollection();
    const playerManagesCollection: Collection<ManageDBProps> = await getPlayerManagesCollection();

    let uniqueCustomLink: string;
    try {
      uniqueCustomLink = await generateUniqueCustomLink(
        playersCollection,
        req.body.customLink // 使用者提供的 customLink（如果有的話）
      );
    } catch (error) {
      // 如果是因為 customLink 重複造成的錯誤，回傳具體錯誤訊息
      if (error instanceof Error) {
        return res.status(HttpStatus.BadRequest).json({ message: error.message });
      }
      throw error; // 其他錯誤繼續拋出
    }

    const newPlayer: PlayerDBProps = {
      ...req.body,
      customLink: req.body.customLink || uniqueCustomLink,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await playersCollection.insertOne(newPlayer);

    if (result.insertedId) {
      const newCourtManage: ManageDBProps = {
        _id: new ObjectId(),
        userId: user._id,
        itemId: newPlayer._id.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const manageResult = await playerManagesCollection.insertOne(newCourtManage);

      if (manageResult.insertedId) {
        return res.status(HttpStatus.Created).json({ message: `已新增${newPlayer.title}!` });
      }
      return res.status(HttpStatus.BadRequest).json({ message: `已新增${newPlayer.title}，但權限新增之敗!` });
    } else {
      return res.status(HttpStatus.InternalServerError).json({ message: '新增撞球選手失敗!' });
    }
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
