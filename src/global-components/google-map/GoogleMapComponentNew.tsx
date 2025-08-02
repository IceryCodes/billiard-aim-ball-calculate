import { useCallback, useEffect, useState } from 'react';

import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { useTheme } from 'next-themes';

import { CourtProps } from '@/domains/court';

import GoogleMarker from './GoogleMarker';
import MapInfoWindow from './MapInfoWindow';

interface GoogleMapComponentProps {
  locationData: CourtProps[];
  lat?: number;
  lng?: number;
}

interface Position {
  lat: number;
  lng: number;
}

const RETRY_INTERVAL = 100; // 重試間隔（毫秒）
const MAX_RETRIES = 50; // 最大重試次數（5秒）

const GoogleMapComponentNew = ({ locationData, lat, lng }: GoogleMapComponentProps) => {
  const { theme } = useTheme();
  const [courts, setCourts] = useState<CourtProps[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<CourtProps | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkGoogleMapsReady = useCallback(async (): Promise<boolean> => {
    let retries = 0;

    while (retries < MAX_RETRIES) {
      if (window.google?.maps && typeof google.maps.Geocoder === 'function') {
        // 確認 Geocoder 是否真的可用
        try {
          new google.maps.Geocoder();
          return true;
        } catch (e) {
          // 如果建構失敗，繼續等待
          console.error('Geocoder 建構失敗', e);
        }
      }

      // 等待一段時間後再試
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
      retries++;
    }

    return false;
  }, []);

  const geocodeAddress = useCallback(async (court: CourtProps): Promise<CourtProps | null> => {
    if (court.location.coordinates.length === 2) {
      return court;
    }

    try {
      const geocoder = new google.maps.Geocoder();

      const result = await new Promise<google.maps.GeocoderResult[] | null>((resolve, reject) => {
        geocoder.geocode(
          {
            address: `${court.county}${court.district}${court.address}`,
          },
          (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      if (!result?.[0]?.geometry?.location) {
        throw new Error('無法取得地理座標');
      }

      return {
        ...court,
        location: {
          type: 'Point',
          coordinates: [result[0].geometry.location.lng(), result[0].geometry.location.lat()],
        },
      };
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error(`地址解析失敗: ${court.county}${court.district}${court.address}`, error);
      }
      return null;
    }
  }, []);

  useEffect(() => {
    const processLocations = async () => {
      try {
        // 等待 Google Maps API 完全載入並確認 Geocoder 可用
        const isReady = await checkGoogleMapsReady();
        if (!isReady) {
          throw new Error('Google Maps API 載入失敗');
        }

        let validLocations: CourtProps[] = [];

        if (lat && lng) {
          validLocations = locationData;
        } else {
          const results = await Promise.all(locationData.map((court) => geocodeAddress(court)));
          validLocations = results.filter((loc): loc is CourtProps => loc !== null);
        }

        setCourts(validLocations);
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('處理地址時發生錯誤:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    processLocations();
  }, [lat, lng, locationData, checkGoogleMapsReady, geocodeAddress]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-[#00000030] rounded">
        <div className="text-center">
          <div className="mb-2">載入地圖中...</div>
          <label className="text-sm text-gray-500">初始化 Google Maps</label>
        </div>
      </div>
    );
  }

  if (!courts.length) {
    return <div className="flex items-center justify-center h-[400px] bg-[#00000030] rounded">找不到地點資料</div>;
  }

  const defaultCenter: Position = {
    lat: courts[0]?.location?.coordinates?.[1] || 25.0606989,
    lng: courts[0]?.location?.coordinates?.[0] || 121.4860045,
  };

  return (
    <div className="w-full h-[400px] shadow-lg rounded overflow-hidden p-2 bg-[#00000030] transition-all duration-300 hover:scale-105 hover:bg-[#00000050]">
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_API_MAP_KEY}>
        <Map
          mapId={theme === 'dark' ? process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_DARK : process.env.NEXT_PUBLIC_GOOGLE_MAP_ID_LIGHT}
          defaultCenter={defaultCenter}
          defaultZoom={courts.length === 1 ? 18 : 14}
        >
          {courts.map((court: CourtProps, index: number) => {
            const position: Position = {
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
                        ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_COURT_FEATURED_FOLDER}/${court.featuredImg}`
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
        </Map>
      </APIProvider>
    </div>
  );
};

export default GoogleMapComponentNew;
