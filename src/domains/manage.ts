import { ObjectId, WithId } from 'mongodb';

import { CourtProps } from './court';
import { PlayerProps } from './player';

export interface ManageProps {
  _id: string;
  userId: string;
  itemId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserManageProps {
  players: WithId<PlayerProps>[];
  courts: WithId<CourtProps>[];
}

export interface CreateManageDto {
  userId: string;
  itemIds: string[];
}

export interface ManageDBProps extends Omit<ManageProps, '_id'> {
  _id: ObjectId;
}
