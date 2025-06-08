/** @type {import('next').NextConfig} */
const baseUrl = process.env.BASE_URL;
const baseUrlDev = process.env.BASE_URL_DEV;
const baseUrlDevSSL = process.env.BASE_URL_DEV_SSL;
const usedUrl = process.env.NODE_ENV === 'production' ? baseUrl : process.env.HTTPS === 'true' ? baseUrlDevSSL : baseUrlDev;

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
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
    ],
  },
  env: {
    NEXT_PUBLIC_ICERY: process.env.ICERY,
    NEXT_PUBLIC_SITENAME: process.env.SITENAME,
    NEXT_PUBLIC_BASE_URL: usedUrl,
    NEXT_PUBLIC_API_BASE_URL: `${usedUrl}/api`,
    NEXT_PUBLIC_FEATURED_IMAGE_URL: process.env.FEATURED_IMAGE_URL,
    NEXT_PUBLIC_FEATURED_IMAGE: '/assets/featured_image.png',
    NEXT_PUBLIC_GOOGLE_API_MAP_KEY: process.env.GOOGLE_API_MAP_KEY,
    NEXT_PUBLIC_GOOGLE_MAP_ID_LIGHT: process.env.GOOGLE_MAP_ID_LIGHT,
    NEXT_PUBLIC_GOOGLE_MAP_ID_DARK: process.env.GOOGLE_MAP_ID_DARK,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
    NEXT_PUBLIC_TOURNAMENT_FEATURED_FOLDER: process.env.TOURNAMENT_FEATURED_FOLDER,
    NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `net` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
        ws: false,
      };

      config.module.rules.push({
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      });
      config.externals = [...config.externals, { canvas: 'canvas' }];
    }
    return config;
  },
};

export default nextConfig;
