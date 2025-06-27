'use client';

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GoogleMap, InfoWindow, Libraries, MarkerF, OverlayView, useLoadScript } from '@react-google-maps/api';
// eslint-disable-next-line import/order
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';

import { useToast } from '@/contexts/ToastContext';
import { CourtProps } from '@/domains/court';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { useCourtsMapMutation } from '@/features/courts/hooks/useCourtsMapMutation';
import { Button } from '@/global-components/buttons/Button';
import { Input, InputStyleType } from '@/global-components/inputs/Input';

import { headerHeight } from '../../../../tailwind.config';

import { darkStyle, lightStyle } from './MapStyle';
import MapTutorialButton from './MapTutorialButton';

interface Location {
  lat: number;
  lng: number;
}

interface CourtMapProps {
  switchMode: () => void;
}

const GOOGLE_MAPS_LIBRARIES: Libraries = ['places', 'maps'];

const CourtMap = ({ switchMode }: CourtMapProps): ReactNode => {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_MAP_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const mapRef = useRef<google.maps.Map | undefined>(undefined);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<Location | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<CourtProps | null>(null);
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [courts, setCourts] = useState<CourtProps[]>([]);
  const [fullDay, setFullDay] = useState<boolean>(false);
  const [partner, setPartner] = useState<boolean>(false);
  const [, setCurrentZoom] = useState<number>(14);

  // 使用 useCourtsMapMutation 查詢資料
  const { isLoading, mutateAsync: fetchCourtsMap } = useCourtsMapMutation({
    onSuccess: (data) => showToast({ message: `共找到${data.total}家撞球場地` }),
  });

  // 使用 useRef 來追蹤是否正在倒數
  const isCountingRef = useRef<boolean>(false);

  // 處理地圖中心改變
  const handleCenterChanged = useCallback(() => {
    if (!mapRef.current || !hasInteracted) return;

    const newCenter = mapRef.current.getCenter();
    if (!newCenter) return;

    const newCenterObj = {
      lat: newCenter.lat(),
      lng: newCenter.lng(),
    };

    setMapCenter(newCenterObj);

    // 如果正在倒數，則重置倒數
    if (isCountingRef.current) {
      setCountdown(3);
    } else {
      // 如果不在倒數，則開始新的倒數
      setShowCountdown(true);
      setCountdown(3);
      isCountingRef.current = true;
    }
  }, [hasInteracted]);

  // 處理縮放等級改變
  const handleZoomChanged = useCallback(() => {
    if (!mapRef.current) return;
    const zoom = mapRef.current.getZoom();
    setCurrentZoom(zoom || 14);
  }, []);

  // 使用 useMemo 來記憶化 fetchData 函數
  const fetchData = useMemo(() => {
    return async () => {
      if (!mapCenter && !userLocation) return;

      try {
        const { courts } = await fetchCourtsMap({
          lat: mapCenter?.lat || userLocation?.lat || 0,
          lng: mapCenter?.lng || userLocation?.lng || 0,
          fullDay,
          partner,
        });

        setCourts(courts || []);
      } catch (error) {
        console.error('Failed to fetch courts:', error);
      }
    };
  }, [fetchCourtsMap, fullDay, mapCenter, userLocation, partner]);

  // 處理拖曳開始
  const handleDragStart = useCallback(() => {
    setHasInteracted(true);
  }, []);

  // 處理地圖載入
  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // 處理地圖卸載
  const onUnmount = useCallback(() => {
    mapRef.current = undefined;
  }, []);

  // 處理 fullDay 切換
  const handleFullDayChange = useCallback((checked: boolean) => {
    setFullDay(checked);
    // 開始倒數
    setShowCountdown(true);
    setCountdown(3);
    isCountingRef.current = true;
  }, []);

  // 處理 partner 切換
  const handlePartnerChange = useCallback((checked: boolean) => {
    setPartner(checked);
    // 開始倒數
    setShowCountdown(true);
    setCountdown(3);
    isCountingRef.current = true;
  }, []);

  // 處理 checkbox 變更
  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>, type: 'fullDay' | 'partner') => {
      const checked = event.target.checked;

      if (type === 'fullDay') {
        handleFullDayChange(checked);
      } else {
        handlePartnerChange(checked);
      }
    },
    [handleFullDayChange, handlePartnerChange]
  );

  // 處理倒數計時
  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => {
        clearInterval(timer);
      };
    }

    // 當倒數結束時
    if (countdown === 0) {
      setShowCountdown(false);
      isCountingRef.current = false;
      fetchData(); // 執行資料獲取
    }
  }, [showCountdown, countdown, fetchData]);

  // 獲取使用者位置
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(location);
          setMapCenter(location);

          // 獲取初始撞球場地數據
          try {
            const { courts } = await fetchCourtsMap({
              lat: location.lat,
              lng: location.lng,
              fullDay: false,
              partner: false,
            });
            setCourts(courts || []);
          } catch (error) {
            console.error('Failed to fetch initial courts:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, [fetchCourtsMap]);

  if (!userLocation) return <div>正在獲取您的位置...</div>;

  if (!isLoaded) return <div>載入地圖中...</div>;

  return (
    <GoogleMap
      mapContainerStyle={{
        width: '100%',
        height: `calc(100vh - ${headerHeight}px)`,
      }}
      center={userLocation}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onCenterChanged={handleCenterChanged}
      onDragStart={handleDragStart}
      onZoomChanged={handleZoomChanged}
      options={{ clickableIcons: false, styles: theme === 'dark' ? darkStyle : lightStyle }}
    >
      {/* 搜尋bar */}
      <div className="flex flex-col items-center gap-y-2">
        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 px-6 py-2 w-full max-w-[350px] md:max-w-[600px] bg-foreground/55 backdrop-blur-md rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-white/10 overflow-hidden">
          {!isLoading ? (
            <div className="flex justify-center items-center gap-x-8">
              <Button text="切換列表模式" onClick={switchMode} />
              <div className="flex items-center gap-x-2">
                <Input
                  type={InputStyleType.Checkbox}
                  checked={fullDay}
                  onChange={(e) => handleCheckboxChange(e, 'fullDay')}
                />
                <label className="text-foreground">24小時營業</label>
              </div>
              <div className="flex items-center gap-x-2">
                <Input
                  type={InputStyleType.Checkbox}
                  checked={partner}
                  onChange={(e) => handleCheckboxChange(e, 'partner')}
                />
                <label className="text-foreground">{`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`}</label>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center gap-x-2">
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-foreground">載入中...</span>
            </div>
          )}
        </div>
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-0 hover:top-20 hover:z-10 transition-all duration-300">
          <MapTutorialButton />
        </div>
      </div>

      {/* 使用者位置標記 */}
      <MarkerF position={userLocation} />

      {/* 撞球場地標記 */}
      {courts.map((court: CourtProps) => {
        // 檢查並交換座標順序
        const position = {
          lat: court.location.coordinates[1], // 使用第二個值作為緯度
          lng: court.location.coordinates[0], // 使用第一個值作為經度
        };

        return (
          <div key={court._id}>
            <MarkerF
              position={position}
              icon={{
                url: '/assets/icon.png',
                scaledSize: new google.maps.Size(32, 32),
                anchor: new google.maps.Point(16, 32),
              }}
              onClick={() => setSelectedCourt(court)}
            />
            <OverlayView position={position} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
              <div
                className={`bg-white px-[6px] py-[2px] rounded whitespace-nowrap absolute -translate-x-1/2 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-transform duration-200 ${selectedCourt?._id === court._id ? 'scale-125 z-10' : ''}`}
                onClick={() => setSelectedCourt(selectedCourt?._id === court._id ? null : court)}
              >
                <label className="cursor-pointer text-black text-xs">{court.title}</label>
              </div>
            </OverlayView>
          </div>
        );
      })}

      {/* 撞球場地資訊視窗 */}
      {selectedCourt && (
        <InfoWindow
          position={{
            lat: selectedCourt.location.coordinates[1],
            lng: selectedCourt.location.coordinates[0],
          }}
          onCloseClick={() => setSelectedCourt(null)}
        >
          <Link
            href={`${getPageUrlByType(PageType.COURTS)}/${selectedCourt.customLink}`}
            target="_blank"
            className="flex flex-col gap-1 p-2"
          >
            <Image
              src={
                selectedCourt.featuredImg
                  ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${selectedCourt.featuredImg}`
                  : process.env.NEXT_PUBLIC_FEATURED_IMAGE
              }
              alt={selectedCourt.title}
              width={216}
              height={121}
              className="rounded w-[216px] h-[121px]"
              placeholder="blur"
              blurDataURL={
                selectedCourt.featuredImg
                  ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${selectedCourt.featuredImg}`
                  : process.env.NEXT_PUBLIC_FEATURED_IMAGE
              }
            />
            <span className="text-black">{selectedCourt.title}</span>
            <span className="text-black">{selectedCourt.county + selectedCourt.district + selectedCourt.address}</span>
          </Link>
        </InfoWindow>
      )}

      {/* 載入指示器 - 修改顯示條件 */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
            bg-white/80 px-6 py-4 rounded-lg shadow-lg transition-all duration-300
            ${showCountdown ? 'opacity-100 z-10' : 'opacity-0 -z-10'}`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cf4f2c]"></div>
          <span className="text-gray-700">正在搜尋附近撞球場地... {countdown}秒</span>
        </div>
      </div>
    </GoogleMap>
  );
};

export default CourtMap;
