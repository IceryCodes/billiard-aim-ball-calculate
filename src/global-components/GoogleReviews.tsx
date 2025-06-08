'use client';

import { ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { GoogleReview } from '@/domains/google';

import Card from './Card';

interface GoogleReviewsProps {
  reviews: GoogleReview[];
}

const GoogleReviews = ({ reviews }: GoogleReviewsProps): ReactNode => {
  if (!reviews.length) return <label>目前沒有Google評論。</label>;

  return (
    <Card>
      <div className="my-4 flex flex-col gap-y-4">
        <h3 className="text-xl font-semibold">Google評論</h3>
        {reviews && reviews.length > 0 ? (
          reviews.map((review, index) => (
            <div key={index} className="border rounded-lg p-4 bg-gray-50 shadow-sm">
              <div className="flex items-center">
                <Image
                  src={review.profile_photo_url}
                  alt={`${review.author_name}的Google檔案`}
                  width={40}
                  height={40}
                  className="mr-3"
                />
                <div>
                  <div className="flex flex-col">
                    <div className="flex gap-x-1">
                      <Link
                        href={review.author_url}
                        className="font-semibold text-blue-600 hover:underline mr-2"
                        target="_blank"
                      >
                        {review.author_name}
                      </Link>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < Math.round(Number(review.rating)) ? 'text-yellow-500 text-lg' : 'text-gray-500 text-lg'
                          }
                        >
                          &#9733;
                        </span> // Star symbol
                      ))}
                    </div>
                    <p className="text-sm text-gray-500">{review.relative_time_description}</p>
                  </div>
                </div>
              </div>
              <p className="text-gray-700">{review.text}</p>
            </div>
          ))
        ) : (
          <label>目前沒有Google評論</label>
        )}
      </div>
    </Card>
  );
};

export default GoogleReviews;
