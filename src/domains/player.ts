import { ObjectId } from 'mongodb';

import { CountyType, GenderType } from '@/domains/interface';

import { GameTypesType } from './tournament';

interface LicenseProps {
  type: string;
  date: Date;
}

export interface PlayerProps {
  _id: string;
  partner: boolean;
  owner: string;
  gender: GenderType;
  gameTypes: GameTypesType[];
  websiteUrl: string;
  email: string;
  phone: string;
  county: CountyType;
  district: string;
  title: string;
  excerpt: string;
  content: string;
  keywords: string[];
  featuredImg: string;
  professional: boolean;
  licenses: LicenseProps[];
  customLink: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetPlayerDto {
  customLink: string;
}

export interface GetPlayersDto {
  query: string;
  page?: number;
  limit?: number;
}

export type UpdatePlayerProps = Omit<
  PlayerProps,
  '_id' | 'createdAt' | 'updatedAt' | 'fullDay' | 'surgery' | 'location' | 'licenseDate' | 'licenseType'
>;
export interface UpdatePlayerDto extends UpdatePlayerProps, Pick<PlayerProps, '_id'> {}
export type CreatePlayerDto = UpdatePlayerProps;
export type DeletePlayerDto = Pick<PlayerProps, '_id'>;
export type UpdatePlayerViewDto = Pick<PlayerProps, '_id'>;

export interface PlayerDBProps extends Omit<PlayerProps, '_id'> {
  _id: ObjectId;
}
