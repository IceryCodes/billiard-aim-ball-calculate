import { ReactNode } from 'react';

import { GoogleBusinessStatus, GoogleOpeningHours } from '@/domains/google';
import GoogleOpening from '@/global-components/GoogleOpeningHours';
import { H3Li } from '@/global-components/lis/H3Li';
import GoogleBusinessStatusTag from '@/global-components/tags/GoogleBusinessStatusTag';
import ConvertLink, { LinkType } from '@/utils/links';

interface GoogleInfosProps {
  title: string;
  rating: number | undefined;
  user_ratings_total: number | undefined;
  business_status: GoogleBusinessStatus | undefined;
  formatted_address: string | undefined;
  website: string | undefined;
  international_phone_number: string | undefined;
  formatted_phone_number: string | undefined;
  opening_hours: GoogleOpeningHours | null | undefined;
}

const GoogleInfos = ({
  title,
  rating,
  user_ratings_total,
  business_status,
  formatted_address,
  website,
  international_phone_number,
  formatted_phone_number,
  opening_hours,
}: GoogleInfosProps): ReactNode => {
  return (
    <div className="p-6 bg-backgroundLight rounded-lg shadow-md mx-auto">
      <h2 className="text-xl font-semibold mb-6">{`${title}Google資料`}</h2>
      <ul className="space-y-6">
        {/* Google Rating */}
        {!!user_ratings_total && (
          <H3Li
            label="Google評分"
            value={
              <span className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < Math.round(Number(rating)) ? 'text-yellow-500' : 'text-gray-500'}>
                    &#9733; {/* Star symbol */}
                  </span>
                ))}
                {` (${user_ratings_total}則評論)`}
              </span>
            }
          />
        )}

        {/* Business Status */}
        {!!business_status && (
          <H3Li
            label="營業狀態"
            value={<span className="font-medium">{GoogleBusinessStatusTag({ status: business_status })}</span>}
          />
        )}

        <H3Li label="開業狀態" value={<span className="font-medium">{status ? '開業' : '歇業'}</span>} />

        {/* Address */}
        {!!formatted_address && (
          <H3Li label="撞球場地地址" value={ConvertLink({ text: formatted_address, type: LinkType.Address })} />
        )}

        {/* Website Links */}
        {!!website && (
          <H3Li
            label="撞球場地網站"
            value={
              <div className="flex flex-col gap-2">
                <span className="text-link hover:underline">
                  {website && ConvertLink({ text: website, type: LinkType.Website })}
                </span>
              </div>
            }
          />
        )}

        {/* Contact Phone */}
        {!!(international_phone_number || formatted_phone_number) && (
          <H3Li
            label="聯絡電話"
            value={
              <div className="flex flex-col gap-2">
                {international_phone_number ? (
                  <span className="text-link hover:underline">
                    {ConvertLink({ text: international_phone_number, type: LinkType.Phone })}
                  </span>
                ) : (
                  formatted_phone_number && (
                    <span className="text-link hover:underline">
                      {ConvertLink({ text: formatted_phone_number, type: LinkType.Phone })}
                    </span>
                  )
                )}
              </div>
            }
          />
        )}
      </ul>
      {opening_hours && <GoogleOpening opening_hours={opening_hours} />}
    </div>
  );
};

export default GoogleInfos;
