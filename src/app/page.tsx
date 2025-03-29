import type { Metadata } from 'next';

import HomeContent from './components/HomeContent';

const pageName: string = '撞球瞄準小工具';
const pageExcerpt: string = '開會無聊想打撞球就做了個撞球瞄準相關的東西，意義不明。';

export async function generateMetadata(): Promise<Metadata> {
  const NAME = 'Icery/阿瑋';
  const SITENAME = '撞球瞄準小工具';
  const SITEURL = 'https://billiards.icery.com';

  return {
    title: pageName,
    description: pageExcerpt,
    authors: [{ name: NAME, url: SITEURL }],
    publisher: NAME,
    creator: NAME,
    generator: NAME,
    applicationName: SITENAME,
    keywords: [SITENAME, NAME],
    metadataBase: new URL(SITEURL),
    openGraph: {
      type: 'website',
      title: pageName,
      description: pageExcerpt,
      emails: ['Icery@Icery.tw'],
      siteName: SITENAME,
      images: {
        url: '/images/Icery_featured_image.jpg',
        secureUrl: '/images/Icery_featured_image.jpg',
        alt: SITENAME + NAME,
        type: 'image/png',
        width: 1920,
        height: 1080,
      },
      url: SITEURL,
    },
  };
}
const Home = () => {
  return (
    <main className="Home-Page -z-10">
      <HomeContent />
    </main>
  );
};

export default Home;
