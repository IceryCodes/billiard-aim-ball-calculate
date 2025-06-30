import { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { DistrictType, getPageUrlByType, PageType } from '@/domains/interface';
import Tag from '@/global-components/tags/Tag';

interface PlayerListItemCardProps {
  partner: boolean;
  image: string;
  title: string;
  county: string;
  district: DistrictType;
  customLink: string;
}

const PlayerListItemCard = ({ partner, image, title, county, district, customLink }: PlayerListItemCardProps): ReactNode => (
  <Link
    href={`${getPageUrlByType(PageType.PLAYERS)}/${customLink}`}
    className="flex flex-col gap-1 border rounded p-4 shadow-lg hover:scale-105 transition-transform duration-300 bg-backgroundLight"
  >
    <Image
      src={image}
      alt="Player Image"
      width={720}
      height={480}
      className="rounded"
      placeholder="blur"
      blurDataURL={image}
    />
    <div className="flex flex-col items-start">
      <span className="text-xl font-bold">{title}</span>
      {partner && <Tag text={`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`} />}
    </div>
    <p>{`${county}${district}`}</p>
  </Link>
);

export default PlayerListItemCard;
