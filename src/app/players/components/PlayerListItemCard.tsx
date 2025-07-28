import { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { DistrictType, getPageUrlByType, PageType } from '@/domains/interface';

interface PlayerListItemCardProps {
  partner: boolean;
  image: string;
  title: string;
  county: string;
  district: DistrictType;
  customLink: string;
}

const PlayerListItemCard = ({ image, title, county, district, customLink }: PlayerListItemCardProps): ReactNode => (
  <Link
    href={`${getPageUrlByType(PageType.PLAYERS)}/${customLink}`}
    className="flex gap-4 border rounded p-4 shadow-lg hover:scale-105 transition-transform duration-300 bg-backgroundLight"
  >
    <Image
      src={image}
      alt={title}
      width={720}
      height={480}
      className="w-24 h-24 rounded-full object-cover"
      blurDataURL={image}
    />
    <div>
      <div className="flex flex-col items-start">
        <span className="text-xl font-bold">{title}</span>
      </div>
      <p>{`${county}${district}`}</p>
    </div>
  </Link>
);

export default PlayerListItemCard;
