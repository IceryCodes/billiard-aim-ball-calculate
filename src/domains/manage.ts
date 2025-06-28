import { ObjectId, WithId } from 'mongodb';

import { CourtProps } from './court';
import { GamerProps } from './gamer';

export interface ManageProps {
  _id: string;
  userId: string;
  itemId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserManageProps {
  gamers: WithId<GamerProps>[];
  courts: WithId<CourtProps>[];
}

export interface CreateManageDto {
  userId: string;
  itemIds: string[];
}

export interface ManageDBProps extends Omit<ManageProps, '_id'> {
  _id: ObjectId;
}
