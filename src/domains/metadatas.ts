import { CourtProps } from './court';
import { getPageUrlByType, PageType } from './interface';
import { PlayerProps } from './player';
import { GameTypesType, TournamentProps } from './tournament';

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

export const defaultCourtExcerpt = ({ title, county, district, address, phone, partner }: CourtProps): string =>
  `${title}是一間位於${county}${district}${address}的撞球場，電話是${phone}，目前${partner ? '是' : '還不是'}${`${process.env.NEXT_PUBLIC_SITENAME}的合作夥伴`}。`;

export const defaultPlayerExcerpt = ({ title, county, district, professional, gameTypes }: PlayerProps): string =>
  `${title}是一位常在${county}${district}的撞球${professional ? '專業選手' : '業餘玩家'}${gameTypes.length > 1 ? `，擅長${gameTypes.join(', ')}` : ''}，歡迎找他切磋球技。`;

export const defaultTournamentExcerpt = ({ title, courtTitle }: TournamentProps): string =>
  `${title}是${courtTitle}所舉辦的比賽，對比賽有興趣的球友可以透過球場詳細資訊的連結或聯絡方式來與球場進行聯繫與報名參賽，比賽結果也會實時更新並保存，以便日後查看與分析，歡迎踴躍報名。`;

export const getDescription = ({ currentPath, data }: GetDescriptionProps): string => {
  switch (true) {
    case currentPath.includes(getPageUrlByType(PageType.REGISTER)):
      return `${process.env.NEXT_PUBLIC_SITENAME}註冊頁面`;
    case currentPath.includes(getPageUrlByType(PageType.LOGIN)):
      return `${process.env.NEXT_PUBLIC_SITENAME}登入頁面`;
    case currentPath.includes(getPageUrlByType(PageType.VERIFY)):
      return `${process.env.NEXT_PUBLIC_SITENAME}驗證頁面`;
    case currentPath.includes(getPageUrlByType(PageType.PROFILE)):
      return `${process.env.NEXT_PUBLIC_SITENAME}個人頁面`;
    case currentPath.includes(`${getPageUrlByType(PageType.AIM)}`):
      return `${PageType.AIM}系統可以透過視覺化的俯視及平視圖來動態模擬實際瞄準的狀態，不僅可以熟悉各個角度的瞄準厚薄，也可以以2D的畫面來感受母球與子球的邊界感，亦能當教學供教練及學員使用。`;
    case currentPath.includes(`${getPageUrlByType(PageType.CUSHION)}`):
      return `${PageType.CUSHION}系統可以透過視覺化的撞球桌來模擬障礙球阻擋時的解球線路，不僅可以新增多個障礙球，母球與子球也能於撞球桌上拖動擺放，更可以透過不同的下塞方式來參考兩顆星與三顆星的解球路徑。`;
    case currentPath.includes(`${getPageUrlByType(PageType.TOURNAMENTS)}/`):
      return defaultTournamentExcerpt(data as TournamentProps);
    case currentPath.includes(`${getPageUrlByType(PageType.TOURNAMENTS)}`):
      return `${PageType.TOURNAMENTS}搜尋列表可以瀏覽全台撞球場所舉辦的各類比賽，不管是${Object.values(GameTypesType).join(', ')}還是其他比賽,都可以透過詳情頁面來了解該場比賽的詳細資訊及該場比賽的實時賽程，撞球場也可以將比賽結果進行保留。`;
    case currentPath.includes(`${getPageUrlByType(PageType.COURTS)}/`):
      return defaultCourtExcerpt(data as CourtProps);
    case currentPath.includes(`${getPageUrlByType(PageType.COURTS)}`):
      return `${PageType.COURTS}搜尋列表可以透過撞球場名稱或所在的縣市地區來搜尋全台灣的撞球場，並可以透過切換地圖模式來大範圍進行搜索，以視覺化的方式來找到附近的撞球場，點進詳情頁面也能得知更多資訊及該撞球場所舉辦的撞球比賽。`;
    case currentPath.includes(`${getPageUrlByType(PageType.PLAYERS)}/`):
      return defaultPlayerExcerpt(data as PlayerProps);
    case currentPath.includes(`${getPageUrlByType(PageType.PLAYERS)}`):
      return `${PageType.PLAYERS}搜尋列表可以透過選手的名稱來進行搜尋，點進詳情頁面也能得知更多資訊及該選手所擅長的比賽類型，若有提供聯絡資訊則可以直接與該選手聯繫，教練亦可善用頁面來經營個人品牌並宣傳近期資訊。`;

    default:
      return `${process.env.NEXT_PUBLIC_SITENAME}是${process.env.NEXT_PUBLIC_ICERY}日常開會無聊時開發的撞球網站，提供全台撞球場的搜尋之外，也讓撞球場可以自行編輯相關資訊，更能透過網站舉辦撞球比賽，實時更新的賽程表讓撞球場可投影於大螢幕且不需手動更新外，也能將比賽結果進行保留，選手除了可以使用瞄球角度跟顆星公式來提升技巧，也能善用自己的撞球選手頁面進行曝光。`;
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
    title:
      pageName === PageType.HOME
        ? `${process.env.NEXT_PUBLIC_SITENAME} - 撞球小工具`
        : `${pageName} - ${process.env.NEXT_PUBLIC_SITENAME}`,
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
  const pagedescription: string = description.replaceAll('\n', ' ') || getDescription({ currentPath, data });

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
