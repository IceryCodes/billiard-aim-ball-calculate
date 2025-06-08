import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import checkNext from 'next-rate-limit';

import { HttpStatus } from './utils/api';

// 擴展 NextRequest 型別
interface GeoInformation {
  country?: string | null;
  region?: string | null;
  city?: string | null;
}

interface ExtendedNextRequest extends NextRequest {
  geo?: GeoInformation;
  ip?: string;
}

// 已知的主要 VPN 提供商 IP 範圍
const VPN_PROVIDERS = [
  // NordVPN
  '194.242.110.0/23',
  '194.242.111.0/24',
  // ExpressVPN
  '148.251.0.0/16',
  '159.122.0.0/16',
  // ProtonVPN
  '185.159.156.0/22',
  // 部分大型雲服務商 IP (常用於 VPN)
  '101.32.0.0/16',
  '47.240.0.0/14',
];

// 允許的爬蟲 IP 範圍
const ALLOWED_BOTS = [
  // Google
  '66.249.64.0/19',
  '64.233.160.0/19',
  '72.14.192.0/18',
  '74.125.0.0/16',
  '66.249.80.0/20',
  '66.249.88.0/24',
  // Bing/Microsoft
  '157.55.39.0/24',
  '207.46.13.0/24',
  '40.77.167.0/24',
  // Baidu
  '180.76.15.0/24',
  // Yahoo
  '8.12.144.0/24',
  '68.180.224.0/21',
  '72.30.196.0/24',
];

// 安全相關的 HTTP 標頭
const securityHeaders = {
  // 原有的 CORS 設定
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers':
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  'Access-Control-Max-Age': '86400', // 24 小時，減少 preflight 請求頻率

  // 安全標頭
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://*.googleapis.com https://*.gstatic.com https://*.google-analytics.com https://*.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://*.googleapis.com",
    `img-src 'self' data: blob: https://*.icery.tw https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com https://*.google-analytics.com https://*.googletagmanager.com`,
    "font-src 'self' https://*.gstatic.com",
    "connect-src 'self' * data: blob: https://*.icery.tw https://*.googleapis.com https://*.gstatic.com https://maps.googleapis.com https://*.google.com https://google.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com  wss://*.workers.dev wss://*.icery.workers.dev ws://*.workers.dev ws://*.icery.workers.dev",
    "worker-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com",
    "child-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com",
    "frame-src 'self' https://www.youtube.com https://*.googleapis.com https://*.gstatic.com",
    "manifest-src 'self' https://*.googleapis.com https://*.gstatic.com",
    "media-src 'self' https://*.googleapis.com https://*.gstatic.com",
  ].join('; '),
};

const requests = Number(process.env.REQUESTS_LIMIT);

const limiter = checkNext({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500,
});

// 檢查 IP 是否在特定範圍內
const isIPInRange = (ip: string, range: string): boolean => {
  try {
    const [rangeIp, bits] = range.split('/');
    const ipLong = ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const rangeLong = rangeIp.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
    const mask = ~((1 << (32 - parseInt(bits))) - 1) >>> 0;
    return (ipLong & mask) === (rangeLong & mask);
  } catch {
    return false;
  }
};

// 檢查是否為允許的爬蟲
const isAllowedBot = (ip: string, userAgent: string | null | undefined): boolean => {
  // 檢查 IP 是否在白名單中
  const isAllowedIP = ALLOWED_BOTS.some((range) => isIPInRange(ip, range));

  // 如果沒有 User-Agent，僅依賴 IP 檢查
  if (!userAgent) return isAllowedIP;

  // 檢查 User-Agent 是否包含已知的爬蟲標識
  const isKnownBot =
    userAgent?.toLowerCase().includes('bot') ||
    userAgent?.toLowerCase().includes('crawler') ||
    userAgent?.toLowerCase().includes('spider');

  return isAllowedIP && (isKnownBot || !userAgent);
};

// 獲取請求的 IP 地址
const getRequestIp = (request: ExtendedNextRequest): string => {
  return (
    request.headers.get('x-vercel-proxied-for') ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
};

// 獲取國家代碼
const getCountryCode = (request: ExtendedNextRequest): string => {
  return request.headers.get('x-vercel-ip-country') || request.geo?.country || 'UNKNOWN';
};

// 環境變數控制
const isGeoBlockingEnabled = process.env.ENABLE_GEO_BLOCKING === 'true';
const isVpnBlockingEnabled = process.env.ENABLE_VPN_BLOCKING === 'true';
const isProductionEnv = process.env.NODE_ENV === 'production';

export async function middleware(req: NextRequest) {
  const extendedReq = req as ExtendedNextRequest;
  const { pathname } = extendedReq.nextUrl;
  const ip = getRequestIp(extendedReq);
  const userAgent = req.headers.get('user-agent');

  // 跳過 WebSocket 相關的安全檢查
  const isWebSocketRequest =
    req.headers.get('upgrade')?.toLowerCase() === 'websocket' ||
    req.headers.get('connection')?.toLowerCase().includes('upgrade');

  // 1. 檢查地理位置和 VPN
  if (isProductionEnv && isGeoBlockingEnabled && !isWebSocketRequest) {
    const country = getCountryCode(extendedReq);
    const isFromTaiwan = country === 'TW';
    const isBot = isAllowedBot(ip, userAgent);
    const isVPN = !isBot && isVpnBlockingEnabled && VPN_PROVIDERS.some((range) => isIPInRange(ip, range));

    // 地理位置檢查（允許爬蟲）
    if (!isFromTaiwan && !isBot) {
      console.error('Blocked IP:', ip, 'Country:', country, 'UserAgent:', userAgent);
      // return NextResponse.json(
      //   {
      //     success: false,
      //     message: '基於安全考慮，目前僅開放台灣地區 IP 訪問',
      //     error: {
      //       code: 'GEO_BLOCKED',
      //       country,
      //     },
      //   },
      //   {
      //     status: HttpStatus.Forbidden,
      //     headers: securityHeaders,
      //   }
      // );
    }

    // VPN 檢查
    if (isVPN) {
      return NextResponse.json(
        {
          success: false,
          message: '基於安全考慮，不允許使用 VPN 訪問',
          error: {
            code: 'VPN_BLOCKED',
            ip,
          },
        },
        {
          status: HttpStatus.Forbidden,
          headers: securityHeaders,
        }
      );
    }
  }

  // 2. 處理 CORS preflight 請求
  if (extendedReq.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: securityHeaders,
    });
  }

  if (pathname.includes('/tournaments/') || pathname.includes('/courts/') || pathname.includes('/players/')) {
    // console.info('檢查頁面是否有 noindex:', pathname);

    // 創建響應
    const response = NextResponse.next();

    // 診斷現有頭信息
    const currentRobotsHeader = response.headers.get('X-Robots-Tag');
    if (currentRobotsHeader) {
      // console.info('發現 X-Robots-Tag:', currentRobotsHeader, '在頁面:', pathname);
    }

    // 確保沒有 noindex 標記
    response.headers.set('X-Robots-Tag', 'index, follow');

    return response;
  }

  // 3. API 請求速率限制（允許爬蟲，跳過 WebSocket）
  if (pathname.startsWith('/api') && !isWebSocketRequest) {
    if (process.env.NODE_ENV !== 'development' && !isAllowedBot(ip, userAgent)) {
      try {
        await limiter.checkNext(extendedReq, requests);
      } catch {
        return NextResponse.json(
          { message: 'Too many requests' },
          {
            status: HttpStatus.TooManyRequests,
            headers: securityHeaders,
          }
        );
      }
    }
  }

  // API token 驗證 (跳過 WebSocket)
  if (pathname.startsWith('/api/') && !isWebSocketRequest) {
    const authHeader = req.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const JWT_SECRET = process.env.JWT_SECRET;

      if (!JWT_SECRET) {
        return NextResponse.json({ message: 'Server configuration error' }, { status: HttpStatus.InternalServerError });
      }

      try {
        await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
      } catch (error) {
        return NextResponse.json(
          {
            message: 'Token expired',
            expired: true,
          },
          {
            status: HttpStatus.Unauthorized,
            headers: securityHeaders,
          }
        );
      }
    }
  }

  // 4. 一般請求處理
  const response = NextResponse.next();

  // 5. 添加安全標頭 (但不影響 WebSocket 升級)
  if (!isWebSocketRequest) {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: [
    // 匹配所有路徑，除了靜態資源
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
    '/admin/:path*',
    '/profile/:path*',
  ],
};
