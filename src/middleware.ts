import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import checkNext from 'next-rate-limit';

import { getMemoryMonitor } from './lib/memory-monitor';
import { SECURITY_LIMITS } from './lib/security-config';
import { HttpStatus } from './utils/api';

interface GeoInformation {
  country?: string | null;
  region?: string | null;
  city?: string | null;
}

interface ExtendedNextRequest extends NextRequest {
  geo?: GeoInformation;
  ip?: string;
}

// === 🎯 開發域名白名單 ===
const DEVELOPMENT_WHITELIST = ['icery.icery.tw', 'localhost', '127.0.0.1', '0.0.0.0'];

// 檢查是否為開發白名單域名
const isDevelopmentDomain = (request: NextRequest): boolean => {
  const host = request.headers.get('host');
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');

  // 檢查 host
  if (host && DEVELOPMENT_WHITELIST.some((domain) => host.includes(domain))) {
    return true;
  }

  // 檢查 origin
  if (origin && DEVELOPMENT_WHITELIST.some((domain) => origin.includes(domain))) {
    return true;
  }

  // 檢查 referer
  if (referer && DEVELOPMENT_WHITELIST.some((domain) => referer.includes(domain))) {
    return true;
  }

  return false;
};

// === 請求來源驗證（加入白名單邏輯）===
const validateReferrer = (request: NextRequest): boolean => {
  // 🎯 白名單檢查：如果是開發域名，直接通過
  if (isDevelopmentDomain(request)) {
    return true;
  }

  const referer = request.headers.get('referer');
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');

  const allowedOrigins = [
    process.env.BASE_URL,
    process.env.BASE_URL_DEV,
    process.env.BASE_URL_DEV_SSL,
    `https://${host}`,
    `http://${host}`,
    // 🎯 明確加入開發域名
    'http://icery.icery.tw:3000',
    'https://icery.icery.tw:3000',
    'http://icery.icery.tw',
    'https://icery.icery.tw',
  ].filter(Boolean);

  if (!referer && !origin) {
    return (process.env.NODE_ENV as string) === 'development';
  }

  const sourceToCheck = origin || referer;
  return allowedOrigins.some((allowed) => sourceToCheck?.startsWith(allowed as string));
};

// VPN 和爬蟲檢測（保持原有邏輯）
const VPN_PROVIDERS = [
  '194.242.110.0/23',
  '194.242.111.0/24',
  '148.251.0.0/16',
  '159.122.0.0/16',
  '185.159.156.0/22',
  '101.32.0.0/16',
  '47.240.0.0/14',
];

const ALLOWED_BOTS = [
  '66.249.64.0/19',
  '64.233.160.0/19',
  '72.14.192.0/18',
  '74.125.0.0/16',
  '66.249.80.0/20',
  '66.249.88.0/24',
  '157.55.39.0/24',
  '207.46.13.0/24',
  '40.77.167.0/24',
  '180.76.15.0/24',
  '8.12.144.0/24',
  '68.180.224.0/21',
  '72.30.196.0/24',
];

// 增強的安全 Headers
const securityHeaders = {
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,DELETE,PATCH,POST,PUT,OPTIONS',
  'Access-Control-Allow-Headers':
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization',
  'Access-Control-Max-Age': '86400',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-scripts.com https://*.googleapis.com https://*.gstatic.com https://*.google-analytics.com https://*.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://*.googleapis.com https://*.gstatic.com",
    "img-src 'self' data: blob: https://*.icery.tw https://*.googleapis.com https://*.gstatic.com https://*.ggpht.com https://*.google-analytics.com https://*.googletagmanager.com https://lh3.googleusercontent.com https://maps.gstatic.com https://maps.googleapis.com",
    "font-src 'self' https://*.gstatic.com https://*.googleapis.com",
    "connect-src 'self' * data: blob: https://*.icery.tw https://*.googleapis.com https://*.gstatic.com https://maps.googleapis.com https://*.google.com https://google.com https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com wss://*.workers.dev wss://*.icery.workers.dev ws://*.workers.dev ws://*.icery.workers.dev",
    "worker-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com",
    "child-src 'self' data: blob: https://*.googleapis.com https://*.gstatic.com",
    "frame-src 'self' https://www.youtube.com https://*.googleapis.com https://*.gstatic.com https://maps.googleapis.com https://www.google.com",
    "manifest-src 'self' https://*.googleapis.com https://*.gstatic.com",
    "media-src 'self' https://*.googleapis.com https://*.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; '),
};

// Rate Limiters
const requests = Number(process.env.REQUESTS_LIMIT || 60);
const generalLimiter = checkNext({ interval: 60 * 1000, uniqueTokenPerInterval: 500 });
const qrLimiter = checkNext({ interval: 60 * 1000, uniqueTokenPerInterval: 100 });
const uploadLimiter = checkNext({ interval: 60 * 1000, uniqueTokenPerInterval: 200 });

// 工具函數
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

const isAllowedBot = (ip: string, userAgent: string | null | undefined): boolean => {
  const isAllowedIP = ALLOWED_BOTS.some((range) => isIPInRange(ip, range));
  if (!userAgent) return isAllowedIP;
  const isKnownBot =
    userAgent?.toLowerCase().includes('bot') ||
    userAgent?.toLowerCase().includes('crawler') ||
    userAgent?.toLowerCase().includes('spider');
  return isAllowedIP && (isKnownBot || !userAgent);
};

const getRequestIp = (request: ExtendedNextRequest): string => {
  return (
    request.headers.get('x-vercel-proxied-for') ||
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
};

const getCountryCode = (request: ExtendedNextRequest): string => {
  return request.headers.get('x-vercel-ip-country') || request.geo?.country || 'UNKNOWN';
};

const isGeoBlockingEnabled = process.env.ENABLE_GEO_BLOCKING === 'true';
const isVpnBlockingEnabled = process.env.ENABLE_VPN_BLOCKING === 'true';
const isProductionEnv = (process.env.NODE_ENV as string) === 'production';
const isDevelopmentEnv = (process.env.NODE_ENV as string) === 'development';

export async function middleware(req: NextRequest) {
  const extendedReq = req as ExtendedNextRequest;
  const { pathname } = extendedReq.nextUrl;
  const ip = getRequestIp(extendedReq);
  const userAgent = req.headers.get('user-agent');
  const memoryMonitor = getMemoryMonitor();

  // 🎯 白名單檢查：如果是開發域名，記錄但放行大部分檢查
  const isWhitelistedDomain = isDevelopmentDomain(req);

  if (isWhitelistedDomain && process.env.ENABLE_SECURITY_LOGGING === 'true') {
    console.info(`[DEV-WHITELIST] ${req.method} ${pathname} from ${ip} via ${req.headers.get('host')}`);
  }

  const isWebSocketRequest =
    req.headers.get('upgrade')?.toLowerCase() === 'websocket' ||
    req.headers.get('connection')?.toLowerCase().includes('upgrade');

  // 請求來源驗證（白名單域名豁免）
  if (pathname.startsWith('/api/') && !isWebSocketRequest && process.env.ENABLE_REFERRER_CHECK === 'true') {
    if (!isWhitelistedDomain && !validateReferrer(req)) {
      console.warn('Invalid referer/origin:', {
        ip,
        referer: req.headers.get('referer'),
        origin: req.headers.get('origin'),
        userAgent,
      });
      return NextResponse.json(
        { message: 'Invalid request origin' },
        { status: HttpStatus.Forbidden, headers: securityHeaders }
      );
    }
  }

  // 地理位置和 VPN 檢查（白名單域名豁免）
  if (isProductionEnv && isGeoBlockingEnabled && !isWebSocketRequest && !isWhitelistedDomain) {
    const country = getCountryCode(extendedReq);
    const isFromTaiwan = country === 'TW';
    const isBot = isAllowedBot(ip, userAgent);
    const isVPN = !isBot && isVpnBlockingEnabled && VPN_PROVIDERS.some((range) => isIPInRange(ip, range));

    if (!isFromTaiwan && !isBot) {
      console.error('Blocked IP:', ip, 'Country:', country, 'UserAgent:', userAgent);
      // 在生產環境可以啟用這個阻擋
      // return NextResponse.json(
      //   {
      //     success: false,
      //     message: '基於安全考慮，目前僅開放台灣地區 IP 訪問',
      //     error: { code: 'GEO_BLOCKED', country },
      //   },
      //   { status: HttpStatus.Forbidden, headers: securityHeaders }
      // );
    }

    if (isVPN) {
      return NextResponse.json(
        {
          success: false,
          message: '基於安全考慮，不允許使用 VPN 訪問',
          error: { code: 'VPN_BLOCKED', ip },
        },
        { status: HttpStatus.Forbidden, headers: securityHeaders }
      );
    }
  }

  // 全局限制和記憶體監控
  if (pathname === '/api/qr-session' && req.method === 'POST') {
    if (!memoryMonitor.checkDailyLimit(ip)) {
      return NextResponse.json(
        { message: '今日 QR Code 生成次數已達上限' },
        { status: HttpStatus.TooManyRequests, headers: securityHeaders }
      );
    }

    if (!memoryMonitor.incrementSessionCount(ip)) {
      return NextResponse.json(
        { message: '同時進行的 session 數量已達上限' },
        { status: HttpStatus.TooManyRequests, headers: securityHeaders }
      );
    }
  }

  // CORS preflight
  if (extendedReq.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: securityHeaders });
  }

  // SEO 設置
  if (pathname.includes('/tournaments/') || pathname.includes('/courts/') || pathname.includes('/players/')) {
    const response = NextResponse.next();
    response.headers.set('X-Robots-Tag', 'index, follow');
    return response;
  }

  // API Rate Limiting（白名單域名在開發環境豁免）
  if (pathname.startsWith('/api') && !isWebSocketRequest) {
    const shouldSkipRateLimit = isDevelopmentEnv || isAllowedBot(ip, userAgent) || (isWhitelistedDomain && isDevelopmentEnv);

    if (!shouldSkipRateLimit) {
      try {
        if (pathname === '/api/qr-session') {
          await qrLimiter.checkNext(extendedReq, SECURITY_LIMITS.QR_GENERATION_LIMIT);
        } else if (pathname === '/api/upload-ocr') {
          await uploadLimiter.checkNext(extendedReq, SECURITY_LIMITS.UPLOAD_LIMIT);
        } else {
          await generalLimiter.checkNext(extendedReq, requests);
        }
      } catch {
        return NextResponse.json(
          { message: 'Too many requests' },
          { status: HttpStatus.TooManyRequests, headers: securityHeaders }
        );
      }
    }
  }

  // JWT 驗證
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
          { message: 'Token expired', expired: true },
          { status: HttpStatus.Unauthorized, headers: securityHeaders }
        );
      }
    }
  }

  // 系統監控端點
  if (pathname === '/api/system/stats' && isDevelopmentEnv) {
    return NextResponse.json(memoryMonitor.getStats());
  }

  const response = NextResponse.next();
  if (!isWebSocketRequest) {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)', '/admin/:path*', '/profile/:path*'],
};
