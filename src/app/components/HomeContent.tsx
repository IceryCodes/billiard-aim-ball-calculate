'use client';
import { useEffect, useRef, useState } from 'react';

import dynamic from 'next/dynamic';
import { AiFillCopyrightCircle } from 'react-icons/ai';

import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Popup from '@/global-components/Popup';

import BilliardAimCalculation from './BilliardAimCalculation';

const BilliardCalculator = dynamic(() => import('./cushion/BilliardCalculator'), { ssr: false });

enum TabType {
  AIM = 0,
  CUSHION = 1,
}

const tabInfo = [
  {
    title: '瞄球視角',
    content: (
      <section className="min-w-80 flex flex-col gap-y-4">
        <div>
          <p>A: 撞擊接觸點</p>
          <p>B: 瞄球視角目標球邊緣</p>
          <p>C: 瞄球視角母球邊緣</p>
        </div>
        <p>※ 圖片可以直接複製</p>
      </section>
    ),
  },
  {
    title: '顆星公式',
    content: (
      <section className="min-w-80 flex flex-col gap-y-4">
        <p>顆星路徑: 黃色</p>
        <div>
          <p>母球: 白色</p>
          <p>目標球: 紅色</p>
          <p>假想球: 透明</p>
          <p>障礙球: 黑色(右鍵新增)</p>
        </div>
        <p>※ 所有球均可拖曳調整位置</p>

        <div>
          <p>※ 每張球檯的桌布以及顆星都有些許不同，演算不一定準確。</p>
          <p>※ 我自己對顆星都不熟，所以顆星公式僅供參考並歡迎指教。</p>
          <p>※ 公式有很多種，這是我目前所知道順桿且不用加塞好記的公式。</p>
        </div>
      </section>
    ),
  },
];

const HomeContent = () => {
  const [tab, setTab] = useState<TabType>(TabType.AIM);
  const [displayModal, setDisplayModal] = useState<boolean>(false);
  const [isMobileVertical, setIsMobileVertical] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [calculatorDimensions, setCalculatorDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const updateDimensions = () => {
      const isVertical = window.innerWidth < window.innerHeight;
      setIsMobileVertical(isVertical);

      // 確保容器尺寸正確
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 20;
        const calculatedHeight = containerWidth / 2;

        setCalculatorDimensions({
          width: Math.max(containerWidth, 320),
          height: Math.max(calculatedHeight, 160),
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    window.addEventListener('orientationchange', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      window.removeEventListener('orientationchange', updateDimensions);
    };
  }, []);

  return (
    <section className="flex flex-col items-center">
      <section className="flex flex-col items-center mt-[20px] mb-[30px] gap-4">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-2xl font-bold">{process.env.NEXT_PUBLIC_SITENAME}</h1>
          <Button onClick={() => setDisplayModal(true)} text="說明" buttonStyle={ButtonStyleType.Active} />
        </div>

        <div className="flex flex-row gap-x-4">
          <Button
            onClick={() => setTab(TabType.AIM)}
            text="瞄球角度"
            buttonStyle={tab === TabType.AIM ? ButtonStyleType.Active : ButtonStyleType.Disabled}
          />
          <Button
            onClick={() => setTab(TabType.CUSHION)}
            text="顆星公式"
            buttonStyle={tab === TabType.CUSHION ? ButtonStyleType.Active : ButtonStyleType.Disabled}
          />
        </div>

        {tab === TabType.CUSHION && isMobileVertical && <label>請將手機旋轉成橫向以顯示撞球桌</label>}

        {/* 用 ref 取得實際容器寬度，並使用計算後的尺寸 */}
        <section ref={containerRef} className="flex flex-col items-center gap-4 w-[80vw] max-w-[800px] px-2.5">
          {tab === TabType.AIM && <BilliardAimCalculation />}
          {tab === TabType.CUSHION && !isMobileVertical && (
            <BilliardCalculator width={calculatorDimensions.width} height={calculatorDimensions.height} />
          )}
        </section>
      </section>

      <Popup title={`${tabInfo[tab].title}說明`} display={displayModal} onClose={() => setDisplayModal(false)}>
        {tabInfo[tab].content}
      </Popup>

      <div className="mt-8 flex flex-col items-center">
        <div className="flex items-center gap-1">
          <a title="Donate Icery" href="https://www.Icery.tw?donate=Icery" target="_blank">
            Donate
          </a>
          <a title="Donate Icery" href="https://www.Icery.tw" target="_blank">
            Icery
          </a>
        </div>

        <div className="flex items-center gap-1">
          <AiFillCopyrightCircle />
          <span style={{ color: 'white' }}>{new Date().getFullYear()} All Rights Reserved. Version 1.6</span>
        </div>
      </div>
    </section>
  );
};

export default HomeContent;
