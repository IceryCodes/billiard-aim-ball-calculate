import type { Metadata } from 'next';

import HomeContent from './components/HomeContent';

const pageExcerpt = '開會無聊想打撞球就做了個撞球瞄準相關的side project，意義不明，看能不能不要一直自刁東錢。';

export async function generateMetadata(): Promise<Metadata> {
  const name = process.env.NEXT_PUBLIC_ICERY;
  const siteName = process.env.NEXT_PUBLIC_SITENAME;
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL;

  return {
    title: siteName,
    description: pageExcerpt,
    authors: [{ name, url: siteUrl }],
    publisher: name,
    creator: name,
    generator: name,
    applicationName: siteName,
    keywords: [siteName, name],
    metadataBase: new URL(siteUrl),
    openGraph: {
      type: 'website',
      title: siteName,
      description: pageExcerpt,
      emails: ['Icery@Icery.tw'],
      siteName,
      images: {
        url: '/images/Icery_featured_image.jpg',
        secureUrl: '/images/Icery_featured_image.jpg',
        alt: siteName + name,
        type: 'image/png',
        width: 1920,
        height: 1080,
      },
      url: siteUrl,
    },
  };
}
const Home = () => {
  return <HomeContent />;
};

export default Home;
