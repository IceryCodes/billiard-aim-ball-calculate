import { GetServerSideProps } from 'next';

import { ArticleProps } from '@/domains/article';
import { CourtProps } from '@/domains/court';
import { getPageUrlByType, PageType } from '@/domains/interface';
import { PlayerProps } from '@/domains/player';
import { TournamentProps } from '@/domains/tournament';
import { getArticles } from '@/services/article';
import { getCourts } from '@/services/court';
import { getPlayers } from '@/services/player';
import { getTournaments } from '@/services/tournament';

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: number;
};

function generateSitemapXml(urls: SitemapUrl[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls
    .map(
      (url) => `
    <url>
      <loc>${escape(url.loc)}</loc>
      ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
      ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
      ${url.priority ? `<priority>${url.priority}</priority>` : ''}
    </url>`
    )
    .join('')}
</urlset>`;
}

function escape(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const SitemapXml = () => {
  // 返回空元素，因為我們只需要 getServerSideProps
  return null;
};

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  if (!res) {
    return {
      notFound: true,
    };
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

    // 基本頁面
    const staticUrls: SitemapUrl[] = [
      {
        loc: baseUrl,
        lastmod: new Date().toISOString(),
        changefreq: 'yearly',
        priority: 1.0,
      },
      {
        loc: `${baseUrl}${getPageUrlByType(PageType.AIM)}`,
        lastmod: new Date().toISOString(),
        changefreq: 'yearly',
        priority: 0.9,
      },
      {
        loc: `${baseUrl}${getPageUrlByType(PageType.CUSHION)}`,
        lastmod: new Date().toISOString(),
        changefreq: 'yearly',
        priority: 0.9,
      },
      {
        loc: `${baseUrl}${getPageUrlByType(PageType.ARTICLES)}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      },
      {
        loc: `${baseUrl}${getPageUrlByType(PageType.COURTS)}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      },
      {
        loc: `${baseUrl}${getPageUrlByType(PageType.PLAYERS)}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      },
      {
        loc: `${baseUrl}${getPageUrlByType(PageType.TOURNAMENTS)}`,
        lastmod: new Date().toISOString(),
        changefreq: 'hourly',
        priority: 0.8,
      },
    ];

    // 獲取動態資料
    const [courtsRes, playersRes, tournamentsRes, articlesRes] = await Promise.allSettled([
      getCourts({
        query: '',
        county: '',
        coaches: [],
        keywords: [],
        fullDay: false,
        partner: false,
        page: 1,
        limit: 0,
      }),
      getPlayers({
        query: '',
        page: 1,
        limit: 0,
      }),
      getTournaments({
        court: '',
        page: 1,
        limit: 0,
      }),
      getArticles({ page: 1, limit: 0 }),
    ]);

    let courtUrls: SitemapUrl[] = [];
    let playerUrls: SitemapUrl[] = [];
    let tournamentUrls: SitemapUrl[] = [];
    let articleUrls: SitemapUrl[] = [];

    // 處理資料
    if (courtsRes.status === 'fulfilled') {
      const { courts } = courtsRes.value;
      courtUrls = (courts ?? []).map(({ customLink, updatedAt }: CourtProps) => ({
        loc: `${baseUrl}${getPageUrlByType(PageType.COURTS)}/${customLink}`,
        lastmod: new Date(updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      }));
    }
    if (playersRes.status === 'fulfilled') {
      const { players } = playersRes.value;
      playerUrls = (players ?? []).map(({ customLink, updatedAt }: PlayerProps) => ({
        loc: `${baseUrl}${getPageUrlByType(PageType.PLAYERS)}/${customLink}`,
        lastmod: new Date(updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      }));
    }
    if (tournamentsRes.status === 'fulfilled') {
      const { tournaments } = tournamentsRes.value;
      tournamentUrls = (tournaments ?? []).map(({ courtCustomLink, customLink, updatedAt }: TournamentProps) => ({
        loc: `${baseUrl}${getPageUrlByType(PageType.COURTS)}/${courtCustomLink}${getPageUrlByType(PageType.TOURNAMENTS)}/${customLink}`,
        lastmod: new Date(updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      }));
    }
    if (articlesRes.status === 'fulfilled') {
      const { articles } = articlesRes.value;
      articleUrls = (articles ?? []).map(({ customLink, updatedAt }: ArticleProps) => ({
        loc: `${baseUrl}${getPageUrlByType(PageType.ARTICLES)}/${customLink}`,
        lastmod: new Date(updatedAt).toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      }));
    }

    // 生成 XML
    const xml = generateSitemapXml([...staticUrls, ...courtUrls, ...playerUrls, ...tournamentUrls, ...articleUrls]);

    // 設定響應標頭
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.write(xml);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.statusCode = 500;
    res.write('Error generating sitemap');
    res.end();

    return {
      props: {},
    };
  }
};

export default SitemapXml;
