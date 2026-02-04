import type { NextConfig } from "next";

const PURCHASE_APP_URL = process.env.PURCHASE_APP_URL || "http://127.0.0.1:3001"

const nextConfig: NextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/admin/purchases',
        destination: `${PURCHASE_APP_URL}/admin/purchases`,
      },
      {
        source: '/admin/purchases/:path*',
        destination: `${PURCHASE_APP_URL}/admin/purchases/:path*`,
      },
    ]
  }
};

export default nextConfig;
