import { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { getPageUrlByType, PageType } from '@/domains/interface';
import Tag from '@/global-components/tags/Tag';

interface TournamentListItemCardProps {
  image: string;
  title: string;
  excerpt: string;
  courtCustomLink: string;
  customLink: string;
  tags: string[];
}

const TournamentListItemCard = ({
  image,
  title,
  excerpt,
  courtCustomLink,
  customLink,
  tags,
}: TournamentListItemCardProps): ReactNode => (
  <Link
    href={`${getPageUrlByType(PageType.COURTS)}/${courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${customLink}`}
    className="flex flex-col gap-1 border rounded p-4 shadow-lg hover:scale-105 transition-transform duration-300 bg-backgroundLight"
  >
    <Image src={image} alt={title} width={720} height={480} className="rounded" placeholder="blur" blurDataURL={image} />
    <div className="flex flex-col items-start">
      <span className="text-xl font-bold">{title}</span>
    </div>
    <p>{excerpt}</p>
    <div className="flex flex-wrap gap-2 mt-2">
      {tags.map((tag: string) => (
        <Tag key={tag} text={tag} />
      ))}
    </div>
  </Link>
);

export default TournamentListItemCard;
