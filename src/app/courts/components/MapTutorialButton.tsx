import { ReactNode, useState } from 'react';

import { Button, ButtonStyleType } from '@/global-components/buttons/Button';
import Popup from '@/global-components/Popup';

const MapTutorialButton = () => {
  const [display, setDisplay] = useState<boolean>(false);

  const PopUpInfo = (): ReactNode => (
    <Popup title="" display={display} onClose={() => setDisplay(false)}>
      <div className={`min-w-[300px] md:min-w-[550px] ${display ? 'flex' : 'hidden'}`}>
        <div className="mx-auto w-fit">
          <ul className="text-start list-decimal list-inside">
            <li>切換明亮或黑暗模式地圖也會改變</li>
            <li>直接移動地圖即可自動搜尋該區撞球場地</li>
            <li>點擊地圖上的撞球場地，會顯示撞球場地資訊</li>
            <li>點擊撞球場地會開啟新分頁，無需擔心跳轉後回不來</li>
            <li>為了瀏覽順暢，一次只會搜尋30筆資料，放太大範圍不會有幫助喔</li>
          </ul>
        </div>
      </div>
    </Popup>
  );

  return (
    <>
      <Button text="地圖模式教學" onClick={() => setDisplay(true)} buttonStyle={ButtonStyleType.Warning} />
      <PopUpInfo />
    </>
  );
};

export default MapTutorialButton;
