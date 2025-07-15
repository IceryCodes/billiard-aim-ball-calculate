import { Collection, ObjectId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { TournamentDBProps } from '@/domains/tournament';
import { convertTournamentDates } from '@/features/tournaments/helper';
import { getTournamentsCollection } from '@/lib/mongodb';
import { TournamentUpdateReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { isManagerToken } from '@/utils/token';

const handler = async (req: NextApiRequest, res: NextApiResponse<TournamentUpdateReturnType>) => {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(HttpStatus.MethodNotAllowed).json({ message: `Method ${req.method} not allowed` });
  }

  // Create an array of keys from TournamentDBProps
  const requiredFields = Object.keys({} as TournamentDBProps) as (keyof TournamentDBProps)[];

  for (const field of requiredFields) {
    if (req.body[field] === undefined) return res.status(HttpStatus.BadRequest).json({ message: `缺少所需資訊: ${field}` });
  }

  if (typeof req.body._id !== 'string' || !ObjectId.isValid(req.body._id))
    return res.status(HttpStatus.BadRequest).json({ message: '更新球場賽程資料失敗!' });

  try {
    const tournamentsCollection: Collection<TournamentDBProps> = await getTournamentsCollection();
    const tournamentId = req.body._id as string;
    const updateFields = req.body;

    delete updateFields._id;

    const updateData: Partial<TournamentDBProps> = {
      ...req.body,
      tournament: convertTournamentDates(req.body.tournament),
      createdAt: new Date(req.body.createdAt),
      updatedAt: new Date(),
    };

    // Fetch the current tournament data to check title
    const currentTournament = await tournamentsCollection.findOne({ _id: new ObjectId(tournamentId) });

    if (!currentTournament) {
      return res.status(HttpStatus.NotFound).json({ message: '球場賽程資料不存在!' });
    }

    const isManager = await isManagerToken({
      authHeader: req.headers.authorization,
      pageId: tournamentId,
    });
    if (!isManager) return res.status(HttpStatus.Forbidden).json({ message: '沒有管理權限!' });

    // Update the tournament information
    const result = await tournamentsCollection.updateOne(
      { _id: new ObjectId(tournamentId), $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
      {
        $set: updateData,
      }
    );

    if (result.modifiedCount === 0) return res.status(HttpStatus.NotFound).json({ message: '球場賽程資料不存在!' });

    res.status(HttpStatus.Ok).json({ message: `已更新${updateData.title}!` });
  } catch (error) {
    console.error('Error updating tournament:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
