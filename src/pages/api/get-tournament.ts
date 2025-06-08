import { Collection, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { TournamentDBProps, TournamentProps } from '@/domains/tournament';
import { getTournamentsCollection } from '@/lib/mongodb';
import { GetTournamentReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetTournamentReturnType>) => {
  const { customLink } = req.query;

  if (typeof customLink !== 'string') {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const tournamentsCollection: Collection<TournamentDBProps> = await getTournamentsCollection();

    const tournament: WithId<TournamentDBProps> | null = await tournamentsCollection.findOne({
      customLink,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });

    const tournamentData: TournamentProps | null = tournament?._id
      ? { ...tournament, _id: tournament._id.toString() }
      : null;

    res.status(HttpStatus.Ok).json({ tournament: tournamentData, message: 'Success' });
  } catch (error) {
    console.error('Error fetching tournament by customLink:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
