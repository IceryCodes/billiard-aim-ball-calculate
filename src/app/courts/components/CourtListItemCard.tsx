import { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { DistrictType, getPageUrlByType, PageType } from '@/domains/interface';
import Tag from '@/global-components/tags/Tag';

interface CourtListItemCardProps {
  partner: boolean;
  image: string;
  title: string;
  county: string;
  district: DistrictType;
  address: string;
  coachs: string[];
  customLink: string;
}

const CourtListItemCard = ({
  partner,
  image,
  title,
  county,
  district,
  address,
  coachs,
  customLink,
}: CourtListItemCardProps): ReactNode => (
  <Link
    href={`${getPageUrlByType(PageType.COURTS)}/${customLink}`}
    className="flex flex-col gap-1 border rounded p-4 shadow-lg hover:scale-105 transition-transform duration-300 bg-backgroundLight"
  >
    <Image
      src={image}
      alt={title}
      width={720}
      height={480}
      className="rounded object-cover w-[480px] h-[320px]"
      blurDataURL={image}
      priority
    />
    <div className="flex flex-col items-start">
      <span className="text-xl font-bold">{title}</span>
      {partner && <Tag text={`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`} />}
    </div>
    <p>{`${county}${district}${address}`}</p>
    <div className="flex flex-wrap gap-2 mt-2">
      {coachs.map((petType: string) => (
        <Tag key={petType} text={petType} />
      ))}
    </div>
  </Link>
);

export default CourtListItemCard;
