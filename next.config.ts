import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Sử dụng ảnh tĩnh trong thư mục public, không cần tối ưu hóa của Next
    unoptimized: true,
  },
};

export default nextConfig;
