import { Collection, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { ArticleDBProps } from '@/domains/article';
import { getArticlesCollection } from '@/lib/mongodb';
import { GetArticlesReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetArticlesReturnType>) => {
  const { page = '1', limit = '10' } = req.query;

  // Parse page and limit as integers
  const currentPage = Number(page);
  const pageSize = Number(limit);

  // Return undefined if query is invalid
  if (isNaN(currentPage) || pageSize < 0 || isNaN(pageSize)) {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();

    const mongoQuery: Record<string, unknown> = {}; // Type-safe object
    mongoQuery.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];

    const total: number = await articlesCollection.countDocuments(mongoQuery);

    const articles: WithId<ArticleDBProps>[] = await articlesCollection
      .find(mongoQuery)
      .sort({ createdAt: -1 })
      .skip(pageSize ? (currentPage - 1) * pageSize : 0)
      .limit(pageSize ?? total)
      .toArray();

    res.status(HttpStatus.Ok).json({
      articles: articles.map((article) => ({ ...article, _id: article._id.toString() })),
      total,
      message: 'Success',
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
