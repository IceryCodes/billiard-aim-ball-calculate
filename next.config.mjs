/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_ICERY: process.env.ICERY,
    NEXT_PUBLIC_SITENAME: process.env.SITENAME,
    NEXT_PUBLIC_SITEURL: process.env.SITEURL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID,
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `net` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
      };

      config.externals = [...config.externals, { canvas: 'canvas' }];
    }
    return config;
  },
};

export default nextConfig;
