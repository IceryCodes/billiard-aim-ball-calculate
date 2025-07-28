import { Collection, WithId } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { ArticleDBProps, ArticleProps } from '@/domains/article';
import { getArticlesCollection } from '@/lib/mongodb';
import { GetArticleReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

const handler = async (req: NextApiRequest, res: NextApiResponse<GetArticleReturnType>) => {
  const { customLink } = req.query;

  if (typeof customLink !== 'string') {
    return res.status(HttpStatus.BadRequest).json({ message: 'Invalid body' });
  }

  try {
    const articlesCollection: Collection<Omit<ArticleDBProps, '_id'>> = await getArticlesCollection();

    const article: WithId<ArticleDBProps> | null = await articlesCollection.findOne({
      customLink,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    });

    const articleData: ArticleProps | null = article?._id ? { ...article, _id: article._id.toString() } : null;

    res.status(HttpStatus.Ok).json({ article: articleData, message: 'Success' });
  } catch (error) {
    console.error('Error fetching article by customLink:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
