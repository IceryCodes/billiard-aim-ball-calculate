import { MetadataRoute } from 'next';

import { getPageUrlByType, PageType } from '@/domains/interface';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  const allow: string[] = [
    '/',
    `${getPageUrlByType(PageType.AIM)}/*`,
    `${getPageUrlByType(PageType.CUSHION)}/*`,
    `${getPageUrlByType(PageType.COURTS)}`,
    `${getPageUrlByType(PageType.PLAYERS)}`,
    `${getPageUrlByType(PageType.TOURNAMENTS)}`,
    `${getPageUrlByType(PageType.COURTS)}/*`,
    `${getPageUrlByType(PageType.PLAYERS)}/*`,
    `${getPageUrlByType(PageType.TOURNAMENTS)}/*`,
  ];

  const disallow: string[] = [
    getPageUrlByType(PageType.ADMIN),
    getPageUrlByType(PageType.LOGIN),
    getPageUrlByType(PageType.REGISTER),
    getPageUrlByType(PageType.VERIFY),
    getPageUrlByType(PageType.PROFILE),
  ];

  return {
    rules: [
      {
        userAgent: '*',
        allow,
        disallow,
      },
      {
        userAgent: 'Googlebot',
        allow,
        disallow,
      },
      {
        userAgent: 'Bingbot',
        allow,
        disallow,
      },
      {
        userAgent: 'GPTBot',
        disallow,
      },
      {
        userAgent: 'Googlebot-Image',
        allow,
        disallow,
      },
      {
        userAgent: 'AdsBot-Google',
        allow,
        disallow,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
