import { Collection } from 'mongodb';
import type { NextApiRequest, NextApiResponse } from 'next';

import { TournamentDBProps, TournamentType } from '@/domains/tournament';
import { generateTournament, generateUniqueCustomLink } from '@/features/tournaments/helper';
import { getTournamentsCollection } from '@/lib/mongodb';
import { TournamentUpdateReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

const handler = async (req: NextApiRequest, res: NextApiResponse<TournamentUpdateReturnType>) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(HttpStatus.MethodNotAllowed).json({ message: `Method ${req.method} not allowed` });
  }

  const requiredFields = Object.keys({} as TournamentDBProps) as (keyof TournamentDBProps)[];
  for (const field of requiredFields) {
    if (req.body[field] === undefined) return res.status(HttpStatus.BadRequest).json({ message: `缺少所需資訊: ${field}` });
  }

  try {
    const tournamentsCollection: Collection<TournamentDBProps> = await getTournamentsCollection();

    let uniqueCustomLink: string;
    try {
      uniqueCustomLink = await generateUniqueCustomLink(
        tournamentsCollection,
        req.body.customLink // 使用者提供的 customLink（如果有的話）
      );
    } catch (error) {
      // 如果是因為 customLink 重複造成的錯誤，回傳具體錯誤訊息
      if (error instanceof Error) {
        return res.status(HttpStatus.BadRequest).json({ message: error.message });
      }
      throw error; // 其他錯誤繼續拋出
    }

    const newTournament: TournamentDBProps = {
      ...req.body,
      customLink: req.body.customLink || uniqueCustomLink,
      featuredImg: req.body.featuredImg || '',
      tags: req.body.tags || [],
      tournament: req.body.tournament || generateTournament({ playerCount: 32, tournamentType: TournamentType.SINGLE }),
      drawingData: req.body.drawingData || {
        lines: [],
        lastUpdated: Date.now(),
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await tournamentsCollection.insertOne(newTournament);

    if (result.insertedId) {
      return res.status(HttpStatus.Created).json({ message: `已新增${newTournament.title}!` });
    } else {
      return res.status(HttpStatus.InternalServerError).json({ message: '新增球場賽程資料失敗!' });
    }
  } catch (error) {
    console.error('Error creating tournament:', error);
    res.status(HttpStatus.InternalServerError).json({ message: `Server error: ${error}` });
  }
};

export default handler;
