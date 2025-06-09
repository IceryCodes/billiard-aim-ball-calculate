import { Collection, ObjectId, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps } from '@/domains/court';
import { TournamentDBProps, TournamentProps } from '@/domains/tournament';
import { getCourtsCollection, getTournamentsCollection } from '@/lib/mongodb';
import { GetTournamentReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetTournamentReturnType>) => {
  const { customLink } = req.query;

  if (typeof customLink !== 'string') {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const tournamentsCollection: Collection<TournamentDBProps> = await getTournamentsCollection();
    const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();

    const tournament: WithId<TournamentDBProps> | null = await tournamentsCollection.findOne({
      customLink,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });

    if (!tournament) {
      return res.status(HttpStatus.NotFound).json({ message: '球場賽程資料不存在' });
    }

    const tournamentData: TournamentProps = {
      ...tournament,
      _id: tournament._id.toString(),
      courtTitle: '',
      courtCustomLink: '',
    };

    if (tournament.court) {
      const court = await courtsCollection.findOne(
        {
          _id: new ObjectId(tournament.court),
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        },
        {
          projection: { _id: 1, title: 1, customLink: 1 },
        }
      );

      if (!court || !court.title || !court.customLink) {
        return res.status(HttpStatus.NotFound).json({ message: '球場資料不存在或不完整' });
      }

      tournamentData.courtTitle = court.title;
      tournamentData.courtCustomLink = court.customLink;
    } else {
      // 如果 tournament 沒有關聯的 court，也回傳 404
      return res.status(HttpStatus.NotFound).json({ message: '撞球場地不存在' });
    }

    res.status(HttpStatus.Ok).json({ tournament: tournamentData, message: 'Success' });
  } catch (error) {
    console.error('Error fetching tournament by customLink:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
