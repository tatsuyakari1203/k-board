import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  // Allow access from local network devices

  allowedDevOrigins: ["localhost:3000", "192.168.1.78:3000", "0.0.0.0:3000"],
};

export default withNextIntl(nextConfig);
