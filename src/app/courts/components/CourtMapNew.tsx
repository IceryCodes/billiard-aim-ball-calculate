'use client';

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { AdvancedMarker, APIProvider, Map, MapEvent, Pin } from '@vis.gl/react-google-maps';
import { useTheme } from 'next-themes';

import { useToast } from '@/contexts/ToastContext';
import { CourtProps } from '@/domains/court';
import { useCourtsMapMutation } from '@/features/courts/hooks/useCourtsMapMutation';
import { Button } from '@/global-components/buttons/Button';
import GoogleMarker from '@/global-components/google-map/GoogleMarker';
import MapInfoWindow from '@/global-components/google-map/MapInfoWindow';
import { Input, InputStyleType } from '@/global-components/inputs/Input';

import MapTutorialButton from './MapTutorialButton';

interface Location {
  lat: number;
  lng: number;
}

interface CourtMapProps {
  switchMode: () => void;
}

const RETRY_INTERVAL = 100;
const MAX_RETRIES = 50;
const DEFAULT_CENTER = { lat: 25.0606989, lng: 121.4860045 }; // 預設中心點（台北）

const CourtMapNew = ({ switchMode }: CourtMapProps): ReactNode => {
  const { theme } = useTheme();
  const { showToast } = useToast();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [mapCenter, setMapCenter] = useState<Location | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<CourtProps | null>(null);
  const [showCountdown, setShowCountdown] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);
  const [courts, setCourts] = useState<CourtProps[]>([]);
  const [fullDay, setFullDay] = useState<boolean>(false);
  const [partner, setPartner] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isApiLoading, setIsApiLoading] = useState<boolean>(true);
  const isCountingRef = useRef<boolean>(false);

  const { isLoading, mutateAsync: fetchCourtsMap } = useCourtsMapMutation({
    onSuccess: (data) => showToast({ message: `共找到${data.total}家撞球場地` }),
  });

  const checkGoogleMapsReady = useCallback(async (): Promise<boolean> => {
    let retries = 0;

    while (retries < MAX_RETRIES) {
      if (window.google?.maps && typeof google.maps.Geocoder === 'function') {
        try {
          new google.maps.Geocoder();
          return true;
        } catch (e) {
          console.error('Maps API 初始化檢查失敗', e);
        }
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      retries++;
    }

    return false;
  }, []);

  useEffect(() => {
    const initializeGoogleMaps = async () => {
      const isReady = await checkGoogleMapsReady();
      if (!isReady) {
        console.error('Google Maps API 載入失敗');
        return;
      }
      setIsApiLoading(false);
    };

    initializeGoogleMaps();
  }, [checkGoogleMapsReady]);

  const fetchData = useMemo(() => {
    return async () => {
      if (!mapCenter && !userLocation) return;

      try {
        const { courts } = await fetchCourtsMap({
          lat: mapCenter?.lat || userLocation?.lat || DEFAULT_CENTER.lat,
          lng: mapCenter?.lng || userLocation?.lng || DEFAULT_CENTER.lng,
          fullDay,
          partner,
        });

        setCourts(courts || []);
      } catch (error) {
        console.error('Failed to fetch courts:', error);
      }
    };
  }, [fetchCourtsMap, fullDay, mapCenter, partner, userLocation]);

  const onCameraChanged = useCallback(
    (event: MapEvent) => {
      if (!isInitialized) {
        setIsInitialized(true);
        return;
      }

      if (event.map.getCenter()) {
        setMapCenter({
          lat: event.map.getCenter()?.lat() || DEFAULT_CENTER.lat,
          lng: event.map.getCenter()?.lng() || DEFAULT_CENTER.lng,
        });

        setShowCountdown(true);
        setCountdown(3);
        isCountingRef.current = true;
      }
    },
    [isInitialized]
  );

  const handleFullDayChange = useCallback((checked: boolean) => {
    setFullDay(checked);
    setShowCountdown(true);
    setCountdown(3);
    isCountingRef.current = true;
  }, []);

  const handlePartnerChange = useCallback((checked: boolean) => {
    setPartner(checked);
    setShowCountdown(true);
    setCountdown(3);
    isCountingRef.current = true;
  }, []);

  useEffect(() => {
    if (showCountdown && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(timer);
    }

    if (countdown === 0) {
      setShowCountdown(false);
      isCountingRef.current = false;
      fetchData();
    }
  }, [showCountdown, countdown, fetchData]);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.geolocation && !isApiLoading) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          setUserLocation(location);
          setMapCenter(location);

          try {
            const { courts } = await fetchCourtsMap({
              lat: location.lat,
              lng: location.lng,
              fullDay: false,
              partner: false,
            });
            setCourts(courts || []);
          } catch (error) {
            setCourts([]);
            console.error('Failed to fetch initial courts:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation(DEFAULT_CENTER);
          setMapCenter(DEFAULT_CENTER);
        }
      );
    }
  }, [fetchCourtsMap, isApiLoading]);

  if (isApiLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="mb-2">載入 Google Maps 中...</div>
          <div className="text-sm text-gray-500">初始化地圖服務</div>
        </div>
      </div>
    );
  }

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="mb-2">正在獲取您的位置...</div>
          <div className="text-sm text-gray-500">請允許位置存取權限</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-content">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_MAP_KEY}>
        <Map
          mapId={theme === 'dark' ? process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_DARK : process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_LIGHT}
          center={mapCenter || userLocation}
          defaultZoom={14}
          onCameraChanged={onCameraChanged}
        >
          {/* 手機版選單按鈕 */}
          <div className="absolute top-14 left-5 z-50 md:hidden">
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 bg-foreground/55 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-foreground/10"
              element={<span className="text-foreground text-2xl font-bold">{isMenuOpen ? '×' : '≡'}</span>}
            />
          </div>
          <div className="block md:hidden absolute bottom-28 left-1/2 -translate-x-1/2 z-0">
            <MapTutorialButton />
          </div>

          {/* 重新定位按鈕 */}
          <div className="absolute bottom-48 right-[10px] z-10">
            <Button
              onClick={() => {
                if (userLocation) {
                  setMapCenter(userLocation);
                  setShowCountdown(true);
                  setCountdown(3);
                  isCountingRef.current = true;
                }
              }}
              className="w-10 h-10 bg-foreground/55 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-foreground/10"
              element={
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="w-5 h-5 text-foreground"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M2 12h2m16 0h2" />
                </svg>
              }
            />
          </div>

          {/* 手機版選單 */}
          <div
            className={`absolute top-28 left-5 z-40 md:hidden transition-all duration-300 transform
              ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
          >
            <div
              className={`p-4 rounded-2xl shadow-lg border border-foreground/10 flex flex-col gap-3 transition-all duration-300 transform
                ${
                  isMenuOpen
                    ? 'bg-foreground/55 backdrop-blur-md opacity-100'
                    : 'bg-foreground/0 backdrop-blur-none opacity-0'
                }`}
            >
              <Button text="切換列表模式" onClick={switchMode} className="whitespace-nowrap" />
              <div className="flex items-center gap-x-2">
                <Input
                  type={InputStyleType.Checkbox}
                  checked={fullDay}
                  onChange={(e) => handleFullDayChange(e.target.checked)}
                />
                <label className="text-foreground text-sm whitespace-nowrap">24小時營業</label>
              </div>
              <div className="flex items-center gap-x-2">
                <Input
                  type={InputStyleType.Checkbox}
                  checked={partner}
                  onChange={(e) => handlePartnerChange(e.target.checked)}
                />
                <label className="text-foreground text-sm whitespace-nowrap">{`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`}</label>
              </div>
            </div>
          </div>

          {/* 桌機版選單 */}
          <div className="hidden md:block absolute top-5 left-1/2 -translate-x-1/2 z-10">
            <div className="px-6 py-2 w-full min-w-[600px] bg-foreground/55 backdrop-blur-md rounded-3xl shadow-[0_2px_6px_rgba(0,0,0,0.2)] border border-foreground/10">
              <div className="flex justify-center items-center gap-x-8">
                <Button text="切換列表模式" onClick={switchMode} />
                <div className="flex items-center gap-x-2">
                  <Input
                    type={InputStyleType.Checkbox}
                    checked={fullDay}
                    onChange={(e) => handleFullDayChange(e.target.checked)}
                  />
                  <label className="text-foreground">24小時營業</label>
                </div>
                <div className="flex items-center gap-x-2">
                  <Input
                    type={InputStyleType.Checkbox}
                    checked={partner}
                    onChange={(e) => handlePartnerChange(e.target.checked)}
                  />
                  <label className="text-foreground">{`${process.env.NEXT_PUBLIC_SITENAME}合作夥伴`}</label>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:block absolute top-16 left-1/2 -translate-x-1/2 z-0 hover:top-20 hover:z-10 transition-all duration-300">
            <MapTutorialButton />
          </div>

          {/* 載入讀取指示器 */}
          {isLoading && (
            <div
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
              bg-white/80 px-4 md:px-6 py-3 md:py-4 rounded-lg shadow-lg z-50"
            >
              <div className="flex items-center gap-x-2">
                <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-700 text-sm md:text-base">載入中...</span>
              </div>
            </div>
          )}

          {/* 使用者位置標記 */}
          <AdvancedMarker position={userLocation}>
            <Pin
              background={theme === 'dark' ? '#cf4f2c' : '#f3e0c5'}
              glyphColor={theme === 'dark' ? '#000' : '#ffffff'}
              borderColor={theme === 'dark' ? '#000' : '#ffffff'}
            />
          </AdvancedMarker>

          {/* 撞球場地標記 */}
          {courts.map((court: CourtProps, index: number) => {
            const position = {
              lat: court.location.coordinates[1],
              lng: court.location.coordinates[0],
            };

            return (
              <div key={index}>
                <GoogleMarker
                  position={position}
                  court={court}
                  selectedCourt={selectedCourt}
                  setSelectedCourt={setSelectedCourt}
                />

                {selectedCourt?._id === court._id && (
                  <MapInfoWindow
                    position={position}
                    court={court}
                    image={
                      court.featuredImg
                        ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${court.featuredImg}`
                        : process.env.NEXT_PUBLIC_FEATURED_IMAGE
                    }
                    title={court.title}
                    description={court.county + court.district + court.address}
                    setSelectedCourt={setSelectedCourt}
                  />
                )}
              </div>
            );
          })}

          {/* 載入倒數指示器 */}
          <div
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
              bg-white/80 px-6 py-4 rounded-lg shadow-lg transition-all duration-300
              ${showCountdown ? 'opacity-100 z-10' : 'opacity-0 -z-10'}`}
          >
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#cf4f2c]"></div>
              <span className="text-gray-700 whitespace-nowrap">正在搜尋附近撞球場地... {countdown}秒</span>
            </div>
          </div>
        </Map>
      </APIProvider>
    </div>
  );
};

export default CourtMapNew;
