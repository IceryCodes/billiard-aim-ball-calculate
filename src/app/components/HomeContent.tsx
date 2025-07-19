import { AiFillCopyrightCircle } from 'react-icons/ai';

import GradientText from '@/global-components/effects/GradientText';
import TrueFocus from '@/global-components/effects/TrueFocus';
import QRButton from '@/global-components/QRButton';

const HomeContent = () => {
  return (
    <section className="flex flex-col items-center">
      <section className="min-h-[calc(100vh-250px)] flex items-center">
        <h1 className="text-2xl font-bold">
          <TrueFocus sentence="瞄 一 個" manualMode borderColor="" />
        </h1>

        <QRButton />
      </section>

      <div className="flex flex-col items-center">
        <div>
          <GradientText
            colors={['#F4A667', '#ffffff', '#cf4f2c', '#F4A667', '#ffffff', '#cf4f2c']}
            className="flex items-center gap-1"
          >
            <a title="Donate Icery" href="https://www.Icery.tw?donate=Icery" target="_blank" className="mr-2">
              Donate
            </a>
            <a title="Icery website" href="https://www.Icery.tw" target="_blank">
              Icery
            </a>
          </GradientText>
        </div>

        <div className="flex items-center gap-1">
          <AiFillCopyrightCircle />
          <span>{new Date().getFullYear()} All Rights Reserved. Version 1.6</span>
        </div>
      </div>
    </section>
  );
};

export default HomeContent;
