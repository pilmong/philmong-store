import type { NextConfig } from "next";

const PURCHASE_APP_URL = process.env.PURCHASE_APP_URL || "https://philmong-purchase.vercel.app"

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
