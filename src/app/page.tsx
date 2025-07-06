import type { Metadata } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';
import { metadataInfo } from '@/domains/metadatas';
import Ballpit from '@/global-components/effects/Ballpit';

import HomeContent from './components/HomeContent';

export async function generateMetadata(): Promise<Metadata> {
  return metadataInfo({
    pageName: PageType.HOME,
    currentPath: `${process.env.NEXT_PUBLIC_BASE_URL}${getPageUrlByType(PageType.HOME)}`,
  });
}
const Home = () => {
  return (
    <>
      <div className="relative h-content overflow-hidden">
        <div className="absolute w-full">
          <HomeContent />
        </div>
        <Ballpit
          colors={[
            '#ffffff', // 白球（母球）
            '#ffffff', // 白球（母球）
            '#ffffff', // 白球（母球）
            '#ffffff', // 白球（母球）
            '#ffffff', // 白球（母球）
            '#ffff00', // 1號球 - 黃色
            '#0000ff', // 2號球 - 藍色
            '#ff0000', // 3號球 - 紅色
            '#800080', // 4號球 - 紫色
            '#ffa500', // 5號球 - 橘色
            '#008000', // 6號球 - 綠色
            '#000000', // 8號球 - 黑球
            '#000000', // 8號球 - 黑球
            '#000000', // 8號球 - 黑球
          ]}
          ambientColor={0xe5e7eb} // 柔和的環境光
          ambientIntensity={0.3} // 大幅降低環境光強度
          lightIntensity={1.2} // 降低主光源強度
          followCursor={false}
          count={50}
          gravity={3}
          friction={0.8}
          wallBounce={0.95}
        />
      </div>
    </>
  );
};

export default Home;
