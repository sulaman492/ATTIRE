import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: process.env.CLOUDINARY_CLOUD_NAME ? [{
      protocol: "https",
      hostname: "res.cloudinary.com",
      port: "",
      pathname: `/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/**`,
      search: "",
    }] : [],
  },
};

export default nextConfig;
