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

export interface GamerProps {
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

export interface GetGamerDto {
  customLink: string;
}

export interface GetGamersDto {
  query: string;
  county: string;
  gameTypes: GameTypesType;
  keywords: string[];
  fullDay: boolean;
  partner: boolean;
  page?: number;
  limit?: number;
}

export type UpdateGamerProps = Omit<
  GamerProps,
  '_id' | 'createdAt' | 'updatedAt' | 'fullDay' | 'surgery' | 'location' | 'licenseDate' | 'licenseType'
>;
export interface UpdateGamerDto extends UpdateGamerProps, Pick<GamerProps, '_id'> {}
export type CreateGamerDto = UpdateGamerProps;
export type DeleteGamerDto = Pick<GamerProps, '_id'>;
export type UpdateGamerViewDto = Pick<GamerProps, '_id'>;

export interface GamerDBProps extends Omit<GamerProps, '_id'> {
  _id: ObjectId;
}
