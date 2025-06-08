import { Collection, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { TournamentDBProps } from '@/domains/tournament';
import { getTournamentsCollection } from '@/lib/mongodb';
import { GetTournamentsReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetTournamentsReturnType>) => {
  const { page = '1', limit = '10' } = req.query;

  // Parse page and limit as integers
  const currentPage = Number(page);
  const pageSize = Number(limit);

  // Return undefined if query is invalid
  if (isNaN(currentPage) || pageSize < 0 || isNaN(pageSize)) {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const tournamentsCollection: Collection<TournamentDBProps> = await getTournamentsCollection();

    const mongoQuery: Record<string, unknown> = {}; // Type-safe object
    mongoQuery.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];

    const total: number = await tournamentsCollection.countDocuments(mongoQuery);

    const tournaments: WithId<TournamentDBProps>[] = await tournamentsCollection
      .find(mongoQuery)
      .skip(pageSize ? (currentPage - 1) * pageSize : 0)
      .limit(pageSize ?? total)
      .toArray();

    res.status(HttpStatus.Ok).json({
      tournaments: tournaments.map((tournament) => ({
        ...tournament,
        _id: tournament._id.toString(),
      })),
      total,
      message: 'Success',
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
