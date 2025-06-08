import { ReactNode, useCallback, useEffect, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { GooglePhoto } from '@/domains/google';

import { Button } from './buttons/Button';
import Card from './Card';

interface GooglePhotoCarouselProps {
  title: string;
  photos: GooglePhoto[];
}

const GooglePhotoCarousel = ({ title, photos }: GooglePhotoCarouselProps): ReactNode => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const renderAttribution = useCallback((attribution: string): ReactNode => {
    const match = attribution.match(/<a href="(.*?)">(.*?)<\/a>/);
    return match?.[1] && match?.[2] ? (
      <Link href={match[1]} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">
        {match[2]}
      </Link>
    ) : null;
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length);
    }, 5000);
    return () => clearInterval(intervalId);
  }, [photos.length]);

  if (!photos.length) return null;

  return (
    <Card>
      <div className="my-4 flex flex-col gap-y-4">
        <h3 className="text-xl font-semibold">Google照片</h3>
        <div className="relative mx-auto w-full">
          <div className="relative h-[250px] md:h-[550px] rounded-lg overflow-hidden">
            {photos.map((photo, index) => (
              <div
                key={photo.photo_reference}
                className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                  index === currentIndex ? 'opacity-100 z-[1]' : 'opacity-0 z-0'
                }`}
              >
                <Image
                  src={photo.base64}
                  alt={`${photos[currentIndex].html_attributions[0].match(/<a href="(.*?)">(.*?)<\/a>/)?.[2]}提供之${title}照片`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw"
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL={photo.base64}
                />
              </div>
            ))}

            <div className="z-10 absolute bottom-0 bg-black bg-opacity-60 w-full py-2 px-4 text-white text-sm">
              由 {renderAttribution(photos[currentIndex].html_attributions[0])} 提供
            </div>
          </div>

          <Button
            element={<>&#10094;</>}
            onClick={() => setCurrentIndex((prevIndex) => (prevIndex - 1 + photos.length) % photos.length)}
            className="z-10 absolute left-2 top-1/2 transform -translate-y-1/2 text-background text-xl bg-link bg-opacity-60 p-2 rounded-full hover:bg-opacity-80 focus:outline-none"
            aria-label="Previous Image"
          />
          <Button
            element={<>&#10095;</>}
            onClick={() => setCurrentIndex((prevIndex) => (prevIndex + 1) % photos.length)}
            className="z-10 absolute right-2 top-1/2 transform -translate-y-1/2 text-background text-xl bg-link bg-opacity-60 p-2 rounded-full hover:bg-opacity-80 focus:outline-none"
            aria-label="Next Image"
          />

          <div className="flex justify-center mt-4 space-x-2">
            {photos.map((_, index) => (
              <Button
                key={index}
                element={<></>}
                onClick={() => setCurrentIndex(index)}
                className={`w-5 h-2 rounded-full ${index === currentIndex ? 'bg-link' : 'bg-gray-400'}`}
                aria-label={`Image ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GooglePhotoCarousel;
