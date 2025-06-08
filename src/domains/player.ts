import { ObjectId } from 'mongodb';

import { CountyType, GenderType } from '@/domains/interface';

export enum GameTypesType {
  EightBall = '八號球',
  NineBall = '九號球',
  TenBall = '十號球',
  FourteenOne = '十號球',
  ThreeCushion = '三顆星',
  Snooker = '斯諾克',
  TwoThreeFive = '二三五',
}

interface LicenseProps {
  type: string;
  date: Date;
}

export interface PlayerProps {
  _id: string;
  partner: boolean;
  orgCode: string;
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
  county: string;
  gameTypes: GameTypesType;
  keywords: string[];
  fullDay: boolean;
  partner: boolean;
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
