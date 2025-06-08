import { ReactNode } from 'react';

import Link from 'next/link';

import { Button } from '@/global-components/buttons/Button';

export enum LinkType {
  Phone = 0,
  Email = 1,
  Address = 2,
  Website = 3,
  Line = 4,
  GoogleMapSearch = 5,
}

interface ConvertLinkProps {
  type: LinkType;
  text: string;
}

const ConvertLink = ({ type, text }: ConvertLinkProps): ReactNode | null => {
  let link: string = text;
  if (type === LinkType.Phone) link = `tel:${text}`;
  if (type === LinkType.Email) link = `mailto:${text}`;
  if (type === LinkType.Address) link = `https://www.google.com.tw/maps/place/${text}`;
  if (type === LinkType.Website) link = `${text}`;
  if (type === LinkType.Line) link = `https://line.me/R/ti/p/${text}`;
  if (type === LinkType.GoogleMapSearch) link = `https://www.google.com/maps/search/?api=1&query=${text}`;

  if (!text) return null;

  return (
    <Link href={link} className="hover:underline" target="_blank">
      {type === LinkType.Website ? <Button text="開啟網站" className="text-sm" /> : text}
    </Link>
  );
};

export default ConvertLink;
