import type { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';

import HomeContent from './components/HomeContent';

export async function generateMetadata(): Promise<Metadata> {
  return metadataInfo({
    pageName: PageType.HOME,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.HOME)}`,
  });
}
const Home = () => {
  return <HomeContent />;
};

export default Home;
