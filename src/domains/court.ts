import { ObjectId } from 'mongodb';

import { CountyType, GenderType } from '@/domains/interface';

export interface CourtProps {
  _id: string;
  partner: boolean;
  orgCode: string;
  owner: string;
  gender: GenderType;
  websiteUrl: string;
  email: string;
  phone: string;
  county: CountyType;
  district: string;
  address: string;
  title: string;
  excerpt: string;
  content: string;
  smoke: boolean;
  coachs: string[];
  keywords: string[];
  featuredImg: string;
  openTime: string;
  closeTime: string;
  fullDay: boolean;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  status: boolean;
  customLink: string;
  googleTitle: string;
  companyName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GetCourtDto {
  customLink: string;
}

export interface GetCourtsMapDto {
  lat: number;
  lng: number;
  fullDay: boolean;
  partner: boolean;
}

export interface GetCourtsDto {
  query: string;
  county: string;
  coaches: string[];
  keywords: string[];
  fullDay: boolean;
  partner: boolean;
  page?: number;
  limit?: number;
}

export type UpdateCourtProps = Omit<CourtProps, '_id' | 'createdAt' | 'updatedAt' | 'fullDay' | 'location'>;
export interface UpdateCourtDto extends UpdateCourtProps, Pick<CourtProps, '_id'> {}
export type CreateCourtDto = UpdateCourtProps;
export type DeleteCourtDto = Pick<CourtProps, '_id'>;
export type UpdateCourtViewDto = Pick<CourtProps, '_id'>;

export interface CourtDBProps extends Omit<CourtProps, '_id'> {
  _id: ObjectId;
}

export const keywordOptions: string[] = [
  '失眠',
  '自律神經失調',
  '睡眠呼吸中止症',
  '睡眠檢測',
  '減重',
  '止鼾牙套',
  '阻塞性呼吸中止症',
  '認知行為療法',
  '藥物治療',
  '不寧腿症候群',
  '嗜睡症',
  '居家睡眠檢測',
  '呼吸器',
  '陽壓呼吸器',
];
