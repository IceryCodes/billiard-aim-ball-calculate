import { CourtProps } from './court';
import { getPageUrlByType, PageType } from './interface';
import { PlayerProps } from './player';
import { TournamentProps } from './tournament';

interface GetDescriptionProps {
  currentPath: string;
  data?: CourtProps | PlayerProps | TournamentProps;
}

interface MetadataInfoProps {
  pageName: string;
  currentPath: string;
  description?: string;
  keywords?: string[];
  email?: string;
  featuredImage?: string;
  data?: CourtProps | PlayerProps | TournamentProps;
}

interface MetadataInfoTournamentProps {
  pageName: string;
  currentPath: string;
  description?: string;
  tags?: string[];
  featuredImage?: string;
  data?: TournamentProps;
}

export const defaultCourtExcerpt = ({ title }: CourtProps): string => `${title}`;

export const defaultPlayerExcerpt = ({ title }: PlayerProps): string => `${title}`;

export const getDescription = ({ currentPath }: GetDescriptionProps): string => {
  switch (true) {
    case currentPath.includes(getPageUrlByType(PageType.HOME)):
      return `${process.env.NEXT_PUBLIC_SITENAME}是一間以寵物健康為建立核心的虛擬公寓，屋頂上提供寵物與鏟屎官透過經驗分享或實際病歷的方式做交流並互相幫助，此外負責人也能透過認證飼主的分享來提升資訊可信度與建立專業形象，除了改善寵物健康資訊封閉的生態外，我們也希望未來與更多寵物產業合作，讓每位有毛或沒毛的寵物都能在公寓內快樂成長與交流!`;
    case currentPath.includes(getPageUrlByType(PageType.REGISTER)):
      return `${process.env.NEXT_PUBLIC_SITENAME}註冊頁面`;
    case currentPath.includes(getPageUrlByType(PageType.LOGIN)):
      return `${process.env.NEXT_PUBLIC_SITENAME}登入頁面`;
    case currentPath.includes(getPageUrlByType(PageType.VERIFY)):
      return `${process.env.NEXT_PUBLIC_SITENAME}驗證頁面`;
    case currentPath.includes(getPageUrlByType(PageType.PROFILE)):
      return `${process.env.NEXT_PUBLIC_SITENAME}個人頁面`;
    default:
      return `${process.env.NEXT_PUBLIC_SITENAME}是一間以寵物健康為建立核心的虛擬公寓，屋頂上提供寵物與鏟屎官透過經驗分享或實際病歷的方式做交流並互相幫助，此外負責人也能透過認證飼主的分享來提升資訊可信度與建立專業形象，除了改善寵物健康資訊封閉的生態外，我們也希望未來與更多寵物產業合作，讓每位有毛或沒毛的寵物都能在公寓內快樂成長與交流!`;
  }
};

export const metadataInfo = ({
  pageName,
  currentPath,
  description = '',
  keywords = [],
  email = '',
  featuredImage = '',
  data,
}: MetadataInfoProps) => {
  const pagedescription: string = description || getDescription({ currentPath, data });
  const featuredImageUrl = `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${featuredImage}`;

  return {
    title: `${pageName} - ${process.env.NEXT_PUBLIC_SITENAME}`,
    description: pagedescription,
    authors: [{ name: pageName, url: currentPath }],
    publisher: process.env.NEXT_PUBLIC_SITENAME,
    creator: process.env.NEXT_PUBLIC_SITENAME,
    generator: process.env.NEXT_PUBLIC_SITENAME,
    applicationName: process.env.NEXT_PUBLIC_SITENAME,
    keywords: [process.env.NEXT_PUBLIC_SITENAME, pageName, ...keywords],
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL),
    openGraph: {
      type: 'website',
      title: process.env.NEXT_PUBLIC_SITENAME,
      description: pagedescription,
      emails: [email, process.env.ADMIN_EMAIL],
      siteName: process.env.NEXT_PUBLIC_SITENAME,
      images: {
        url: new URL(
          featuredImage ? featuredImageUrl : `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_FEATURED_IMAGE}`
        ),
        secureUrl: new URL(
          featuredImage ? featuredImageUrl : `${process.env.NEXT_PUBLIC_BASE_URL}${process.env.NEXT_PUBLIC_FEATURED_IMAGE}`
        ),
        alt: process.env.NEXT_PUBLIC_SITENAME,
        type: 'image/png',
        width: 1920,
        height: 1080,
      },
      url: currentPath,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
};

export const metadataTournamentInfo = ({
  pageName,
  currentPath,
  description = '',
  tags = [],
  featuredImage = '',
  data,
}: MetadataInfoTournamentProps) => {
  const pagedescription: string = description || getDescription({ currentPath, data });

  return {
    title: `${pageName} - ${process.env.NEXT_PUBLIC_SITENAME}`,
    description: pagedescription,
    authors: [{ name: pageName, url: currentPath }],
    publisher: process.env.NEXT_PUBLIC_SITENAME,
    creator: process.env.NEXT_PUBLIC_SITENAME,
    generator: process.env.NEXT_PUBLIC_SITENAME,
    applicationName: process.env.NEXT_PUBLIC_SITENAME,
    keywords: [process.env.NEXT_PUBLIC_SITENAME, pageName, ...tags],
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL),
    openGraph: {
      type: 'website',
      title: process.env.NEXT_PUBLIC_SITENAME,
      description: pagedescription,
      emails: [process.env.ADMIN_EMAIL],
      siteName: process.env.NEXT_PUBLIC_SITENAME,
      images: {
        url: new URL(
          `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_TOURNAMENT_FEATURED_FOLDER}/${featuredImage}`
        ),
        secureUrl: new URL(
          `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_TOURNAMENT_FEATURED_FOLDER}/${featuredImage}`
        ),
        alt: process.env.NEXT_PUBLIC_SITENAME,
        type: 'image/png',
        width: 1920,
        height: 1080,
      },
      url: currentPath,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
      },
    },
  };
};
