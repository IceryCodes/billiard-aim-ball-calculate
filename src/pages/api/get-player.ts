import { Collection, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { PlayerDBProps, PlayerProps } from '@/domains/player';
import { getPlayersCollection } from '@/lib/mongodb';
import { GetPlayerReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { getManagePlayerRecordsByCategoryId } from '@/utils/apiFunctions';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetPlayerReturnType>) => {
  const { customLink } = req.query;

  if (typeof customLink !== 'string') {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const playersCollection: Collection<PlayerDBProps> = await getPlayersCollection();

    const player: WithId<PlayerDBProps> | null = await playersCollection.findOne({
      customLink: decodeURIComponent(customLink),
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });

    const manage = !!(
      player &&
      (await getManagePlayerRecordsByCategoryId({
        id: player._id,
      }))
    );

    const playerData: PlayerProps | null = player?._id ? { ...player, _id: player._id.toString() } : null;

    res.status(HttpStatus.Ok).json({ player: playerData, manage, message: 'Success' });
  } catch (error) {
    console.error('Error fetching player by ID:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
