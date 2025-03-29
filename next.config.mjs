/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
  env: {},
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `net` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        dns: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
