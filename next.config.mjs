import path from 'path';
import { fileURLToPath } from 'url';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilePath);

/** @type {import('next').NextConfig} */
const baseUrl = process.env.BASE_URL;
const baseUrlDev = process.env.BASE_URL_DEV;
const baseUrlDevSSL = process.env.BASE_URL_DEV_SSL;
const usedUrl = process.env.NODE_ENV === 'production' ? baseUrl : process.env.HTTPS === 'true' ? baseUrlDevSSL : baseUrlDev;

// 基本的 remote patterns
const baseRemotePatterns = [
  {
    protocol: 'https',
    hostname: 'lh3.googleusercontent.com',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'maps.gstatic.com',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: 'maps.googleapis.com',
    port: '',
    pathname: '/**',
  },
  {
    protocol: 'https',
    hostname: '**.icery.tw',
    port: '',
    pathname: '/**',
  },
];

// 開發環境額外加入 localhost
const developmentRemotePatterns = [
  {
    protocol: 'http',
    hostname: 'localhost',
    port: '3000',
    pathname: '/**',
  },
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns:
      process.env.NODE_ENV === 'production' ? baseRemotePatterns : [...baseRemotePatterns, ...developmentRemotePatterns],
  },
  env: {
    NEXT_PUBLIC_ICERY: process.env.ICERY,
    NEXT_PUBLIC_SITENAME: process.env.SITENAME,
    NEXT_PUBLIC_BASE_URL: usedUrl,
    NEXT_PUBLIC_API_BASE_URL: `${usedUrl}/api`,
    NEXT_PUBLIC_FEATURED_IMAGE_URL: process.env.FEATURED_IMAGE_URL,
    NEXT_PUBLIC_FEATURED_IMAGE: '/assets/featured_image.png',
    NEXT_PUBLIC_FEATURED_IMAGE_FOLDER: process.env.FEATURED_IMAGE_FOLDER,
    NEXT_PUBLIC_GOOGLE_API_MAP_KEY: process.env.GOOGLE_API_MAP_KEY,
    NEXT_PUBLIC_GOOGLE_MAP_ID_LIGHT: process.env.GOOGLE_MAP_ID_LIGHT,
    NEXT_PUBLIC_GOOGLE_MAP_ID_DARK: process.env.GOOGLE_MAP_ID_DARK,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
    NEXT_PUBLIC_ARTICLE_FEATURED_FOLDER: process.env.ARTICLE_FEATURED_FOLDER,
    NEXT_PUBLIC_TOURNAMENT_FEATURED_FOLDER: process.env.TOURNAMENT_FEATURED_FOLDER,
    NEXT_PUBLIC_COURT_FEATURED_FOLDER: process.env.COURT_FEATURED_FOLDER,
    NEXT_PUBLIC_PLAYER_FEATURED_FOLDER: process.env.PLAYER_FEATURED_FOLDER,
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  webpack: (config, { isServer }) => {
    // 修正路徑別名
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(currentDir, 'src'),
    };

    // 客戶端 fallbacks
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        ws: false,
      };
    }

    // ES 模組處理
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Canvas 外部模組（伺服器端）
    if (isServer) {
      config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    }

    return config;
  },
};

export default nextConfig;
