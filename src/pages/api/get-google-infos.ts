export const runtime = 'nodejs';
import axios from 'axios';
import type { NextApiRequest, NextApiResponse } from 'next';

import { GooglePhoto } from '@/domains/google';
import { GetGoogleInfosReturnType } from '@/services/interfaces';
import { HttpStatus } from '@/utils/api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetGoogleInfosReturnType | { error: string }>
) {
  if (req.method !== 'GET') return res.status(HttpStatus.MethodNotAllowed).json({ error: 'Method not allowed' });

  const { query, byTitle } = req.query;
  if (!query) return res.status(HttpStatus.BadRequest).json({ error: 'Query parameter is required' });

  // try {
  //   const placeIdRes = await axios.post(
  //     'https://places.googleapis.com/v1/places:searchText',
  //     {
  //       textQuery: query,
  //     },
  //     {
  //       headers: {
  //         'X-Goog-Api-Key': process.env.GOOGLE_API_PLACE_KEY,
  //         'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.priceLevel',
  //         'Content-Type': 'application/json',
  //       },
  //     }
  //   )

  //   console.log('placeIdRes', placeIdRes.data);

  // } catch (error) {
  //   console.error('Error:', error);
  // }

  // if (process.env.NODE_ENV === 'development')
  //   return res.status(HttpStatus.BadRequest).json({ error: 'testing mode, stop here' });

  try {
    let placeId = '';

    // 通過標題搜尋地點
    if (byTitle === 'true') {
      const placeIdRes = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        {
          textQuery: query,
        },
        {
          headers: {
            'X-Goog-Api-Key': process.env.GOOGLE_API_PLACE_KEY,
            'X-Goog-FieldMask': 'places.id',
            'Content-Type': 'application/json',
          },
        }
      );

      // console.log('placeIdRes', placeIdRes.data);
      if (!placeIdRes.data.places[0].id) {
        return res.status(HttpStatus.BadRequest).json({ error: 'Failed to fetch place ID' });
      }

      placeId = placeIdRes.data.places[0].id;
    } else {
      // 通過地址搜尋地點
      const placeIdRes = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: query,
          key: process.env.GOOGLE_API_PLACE_KEY,
        },
      });

      if (!placeIdRes.data.results?.[0]?.place_id) {
        return res.status(HttpStatus.BadRequest).json({ error: 'Failed to fetch place ID' });
      }

      placeId = placeIdRes.data.results[0].place_id;
    }

    if (!placeId) return res.status(HttpStatus.BadRequest).json({ error: 'Failed to fetch place id' });

    // 獲取地點詳細信息
    const detailsRes = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        key: process.env.GOOGLE_API_PLACE_KEY,
        fields:
          'address_component,adr_address,business_status,formatted_address,geometry,icon,icon_background_color,icon_mask_base_uri,name,photo,place_id,plus_code,type,url,utc_offset,vicinity,formatted_phone_number,international_phone_number,opening_hours,website,price_level,rating,reviews,user_ratings_total,scope,permanently_closed,reservable,serves_beer,serves_breakfast,serves_brunch,serves_dinner,serves_lunch,serves_vegetarian_food,takeout',
        language: 'zh-TW',
      },
    });

    const placeData = detailsRes.data.result;

    if (!placeData) return res.status(HttpStatus.BadRequest).json({ error: 'Failed to fetch place details' });

    // Fetch and convert photos to base64
    const photosWithData = await Promise.all(
      (placeData.photos || []).map(async (photo: GooglePhoto) => {
        try {
          const photoRes = await axios.get('https://maps.googleapis.com/maps/api/place/photo', {
            params: {
              maxwidth: 400,
              photo_reference: photo.photo_reference,
              key: process.env.GOOGLE_API_PLACE_KEY,
            },
            responseType: 'arraybuffer',
          });

          return {
            ...photo,
            base64: `data:image/jpeg;base64,${Buffer.from(photoRes.data).toString('base64')}`,
          };
        } catch (error) {
          console.error('Error fetching photo:', error);
          return photo;
        }
      })
    );

    const {
      address_components = [],
      adr_address = '',
      business_status = '',
      formatted_address = '',
      geometry = null,
      icon = '',
      icon_background_color = '',
      icon_mask_base_uri = '',
      name = '',
      place_id: fetchedPlaceId = '',
      plus_code = null,
      types = [],
      url = '',
      utc_offset = 0,
      vicinity = '',
      formatted_phone_number = '',
      international_phone_number = '',
      opening_hours = null,
      website = '',
      price_level = null,
      rating = 0,
      reviews = [],
      user_ratings_total = 0,
      scope = '',
      permanently_closed = false,
      reservable = false,
      serves_beer = false,
      serves_breakfast = false,
      serves_brunch = false,
      serves_dinner = false,
      serves_lunch = false,
      serves_vegetarian_food = false,
      takeout = false,
    } = placeData;

    return res.status(HttpStatus.Ok).json({
      address_components,
      adr_address,
      business_status,
      formatted_address,
      geometry,
      icon,
      icon_background_color,
      icon_mask_base_uri,
      name,
      photos: photosWithData,
      place_id: fetchedPlaceId,
      plus_code,
      types,
      url,
      utc_offset,
      vicinity,
      formatted_phone_number,
      international_phone_number,
      opening_hours,
      website,
      price_level,
      rating,
      reviews,
      user_ratings_total,
      scope,
      permanently_closed,
      reservable,
      serves_beer,
      serves_breakfast,
      serves_brunch,
      serves_dinner,
      serves_lunch,
      serves_vegetarian_food,
      takeout,
    });
  } catch (error) {
    console.error('Error fetching place details:', error);
    return res.status(HttpStatus.InternalServerError).json({ error: 'Failed to fetch details' });
  }
}
