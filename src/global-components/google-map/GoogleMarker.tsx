import { useState } from 'react';

import { AdvancedMarker } from '@vis.gl/react-google-maps';
import Image from 'next/image';

import { CourtProps } from '@/domains/court';

interface GoogleMarkerProps {
  position: google.maps.LatLngLiteral;
  court: CourtProps;
  selectedCourt: CourtProps | null;
  setSelectedCourt: (court: CourtProps | null) => void;
}

const GoogleMarker = ({ position, court, selectedCourt, setSelectedCourt }: GoogleMarkerProps) => {
  const [hovered, setHovered] = useState<boolean>(false);

  return (
    <AdvancedMarker
      position={position}
      onClick={() => setSelectedCourt(court)}
      zIndex={selectedCourt?._id === court._id ? 1 : 0}
    >
      <div
        className={`
        flex flex-col items-center gap-y-1 cursor-pointer
        transition-all duration-200 ease-in-out
        ${selectedCourt?._id === court._id ? 'scale-125' : 'scale-100'}
      `}
      >
        <div className="relative flex justify-center">
          <Image
            src="/assets/icon.png"
            alt={court.title}
            width={24}
            height={24}
            className={`rounded transition-all duration-200 ease-in-out ${hovered ? 'opacity-0' : ''}`}
            blurDataURL="/assets/icon.png"
          />
          <Image
            src={
              court.featuredImg
                ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${court.featuredImg}`
                : process.env.NEXT_PUBLIC_FEATURED_IMAGE
            }
            alt={court.title}
            width={128}
            height={72}
            className={`absolute top-0 rounded transition-all duration-200 ease-in-out ${!hovered ? 'opacity-0' : ''}`}
            style={{ transform: 'translateY(-45px)' }}
            placeholder="blur"
            blurDataURL={
              court.featuredImg
                ? `${process.env.NEXT_PUBLIC_FEATURED_IMAGE_URL}/${process.env.NEXT_PUBLIC_FEATURED_IMAGE_FOLDER}/${court.featuredImg}`
                : process.env.NEXT_PUBLIC_FEATURED_IMAGE
            }
          />
        </div>
        <label
          className={`cursor-pointer text-black text-xs bg-white px-[6px] py-[2px] rounded whitespace-nowrap ${court.fullDay ? ' border-2 border-red-600 shadow-[0_0_10px_rgba(255,0,0,0.7)]' : 'shadow-[0_0_10px_rgba(0,0,0,0.5)]'}`}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {court.title}
        </label>
      </div>
    </AdvancedMarker>
  );
};

export default GoogleMarker;
