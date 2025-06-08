import { Collection, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps } from '@/domains/court';
import { getCourtsCollection } from '@/lib/mongodb';
import { GetCourtsReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetCourtsReturnType>) => {
  const { query, county, petTypes, keywords, fullDay, partner, page = '1', limit = '10' } = req.query;

  // Parse page and limit as integers
  const currentPage = Number(page);
  const pageSize = Number(limit);

  // Return undefined if query is invalid
  if (isNaN(currentPage) || pageSize < 0 || isNaN(pageSize)) {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();

    const mongoQuery: Record<string, unknown> = {}; // Type-safe object
    mongoQuery.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];

    if (fullDay === 'true') mongoQuery.fullDay = true;
    if (partner === 'true') mongoQuery.partner = true;

    if (query && typeof query === 'string') {
      const queryWords = query.toLowerCase().split(' ').filter(Boolean);

      if (mongoQuery.title) {
        mongoQuery.$and = [{ title: mongoQuery.title }, { title: { $regex: queryWords.join('|'), $options: 'i' } }];
        delete mongoQuery.title;
      } else {
        mongoQuery.title = { $regex: queryWords.join('|'), $options: 'i' };
      }
    }

    if (county && typeof county === 'string') {
      mongoQuery.county = county;
    }
    if (petTypes && typeof petTypes === 'string') {
      mongoQuery.petTypes = { $in: [petTypes] };
    }

    if (keywords && typeof keywords === 'string') {
      const keywordsArray = keywords
        .toLowerCase()
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean);

      mongoQuery.keywords = { $in: keywordsArray.map((kw) => new RegExp(kw, 'i')) };
    }

    const total: number = await courtsCollection.countDocuments(mongoQuery);

    const courts: WithId<CourtDBProps>[] = await courtsCollection
      .find(mongoQuery)
      .sort({ partner: -1, viewed: -1, title: 1, _id: 1 })
      .skip(pageSize ? (currentPage - 1) * pageSize : 0)
      .limit(pageSize ?? total)
      .toArray();

    res.status(HttpStatus.Ok).json({
      courts: courts.map((court) => ({ ...court, _id: court._id.toString() })),
      total,
      message: 'Success',
    });
  } catch (error) {
    console.error('Error fetching courts:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
