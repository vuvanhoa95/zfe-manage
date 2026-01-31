import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sử dụng ảnh tĩnh trong thư mục public, không cần tối ưu hóa của Next
    unoptimized: true,
  },
  // Turbopack config (Next.js 16+)
  turbopack: {},
  // Webpack config for compatibility
  webpack: (config, { isServer }) => {
    // Exclude Node.js modules from client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
