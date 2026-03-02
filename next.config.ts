import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sử dụng ảnh tĩnh trong thư mục public, không cần tối ưu hóa của Next
    unoptimized: true,
  },
  // Mark server-only packages that should not be bundled by Turbopack
  serverExternalPackages: ['@react-email/render', 'prettier'],
  // Turbopack config (Next.js 16+)
  // Ép root về thư mục ZfeManage để tránh Next tự suy ra root ở cấp trên
  // (tránh lỗi không tìm thấy module như @prisma/client khi chạy dev từ workspace cha)
  turbopack: {
    root: __dirname,
  },
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
