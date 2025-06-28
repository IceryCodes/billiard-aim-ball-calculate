import { Collection, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { CourtDBProps, CourtProps } from '@/domains/court';
import { getCourtsCollection } from '@/lib/mongodb';
import { GetCourtReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';
import { getManageGamerRecordsByCategoryId } from '@/utils/apiFunctions';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetCourtReturnType>) => {
  const { customLink } = req.query;

  if (typeof customLink !== 'string') {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const courtsCollection: Collection<CourtDBProps> = await getCourtsCollection();

    const court: WithId<CourtDBProps> | null = await courtsCollection.findOne({
      customLink: decodeURIComponent(customLink),
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });

    const manage = !!(
      court &&
      (await getManageGamerRecordsByCategoryId({
        id: court._id,
      }))
    );

    const courtData: CourtProps | null = court?._id ? { ...court, _id: court._id.toString() } : null;

    res.status(HttpStatus.Ok).json({ court: courtData, manage, message: 'Success' });
  } catch (error) {
    console.error('Error fetching court by ID:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
