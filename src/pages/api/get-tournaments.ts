import { Collection, ObjectId, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps } from '@/domains/court';
import { TournamentDBProps } from '@/domains/tournament';
import { getCourtsCollection, getTournamentsCollection } from '@/lib/mongodb';
import { GetTournamentsReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetTournamentsReturnType>) => {
  const { court = '', page = '1', limit = '10', excludeId = '' } = req.query;

  // Parse page and limit as integers
  const currentPage = Number(page);
  const pageSize = Number(limit);

  // Return undefined if query is invalid
  if (isNaN(currentPage) || pageSize < 0 || isNaN(pageSize)) {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const tournamentsCollection: Collection<TournamentDBProps> = await getTournamentsCollection();
    const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();

    const mongoQuery: Record<string, unknown> = {}; // Type-safe object
    mongoQuery.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];

    if (court) {
      mongoQuery.court = court;
    }

    if (excludeId) {
      mongoQuery._id = { $ne: new ObjectId(excludeId.toString()) };
    }

    const total: number = await tournamentsCollection.countDocuments(mongoQuery);

    const tournaments: WithId<TournamentDBProps>[] = await tournamentsCollection
      .find(mongoQuery)
      .skip(pageSize ? (currentPage - 1) * pageSize : 0)
      .limit(pageSize ?? total)
      .toArray();

    const courtIds = [...new Set(tournaments.map((t) => t.court).filter(Boolean))];
    const courts = await courtsCollection
      .find({
        _id: { $in: courtIds.map((id) => new ObjectId(id)) },
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
      })
      .project({ _id: 1, title: 1, customLink: 1 })
      .toArray();

    const courtInfoMap = new Map<string, { title: string; customLink: string }>();
    courts.forEach((court) => {
      courtInfoMap.set(court._id.toString(), {
        title: court.title || '',
        customLink: court.customLink || '',
      });
    });

    res.status(HttpStatus.Ok).json({
      tournaments: tournaments.map((tournament) => {
        const courtInfo = courtInfoMap.get(tournament.court ?? '');
        return {
          ...tournament,
          _id: tournament._id.toString(),
          courtTitle: courtInfo?.title ?? '',
          courtCustomLink: courtInfo?.customLink ?? '',
        };
      }),
      total,
      message: 'Success',
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
