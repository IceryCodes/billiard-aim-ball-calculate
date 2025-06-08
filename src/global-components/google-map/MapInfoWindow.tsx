import { InfoWindow } from '@vis.gl/react-google-maps';
import Image from 'next/image';
import Link from 'next/link';

import { CourtProps } from '@/domains/court';
import { getPageUrlByType, PageType } from '@/domains/interface';

interface MapInfoWindowProps {
  position: google.maps.LatLngLiteral;
  court: CourtProps;
  image: string;
  title: string;
  description: string;
  setSelectedCourt: (court: CourtProps | null) => void;
}

const MapInfoWindow = ({ position, court, image, title, description, setSelectedCourt }: MapInfoWindowProps) => {
  return (
    <InfoWindow position={position} onCloseClick={() => setSelectedCourt(null)} pixelOffset={[0, -55]}>
      <Link
        href={`${getPageUrlByType(PageType.COURTS)}/${court.customLink}`}
        target="_blank"
        className="flex flex-col gap-y-1 p-2"
      >
        <div className="flex justify-center">
          <Image
            src={image}
            alt={title}
            width={216}
            height={121}
            className="rounded w-[216px] h-[121px]"
            placeholder="blur"
            blurDataURL={image}
          />
        </div>
        <span className="text-black">{title}</span>
        <span className="text-black">{description}</span>
      </Link>
    </InfoWindow>
  );
};

export default MapInfoWindow;
