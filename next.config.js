/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,  // Disable SWC minification for Windows compatibility
  compiler: {
    removeConsole: false
  },
  experimental: {
    optimizePackageImports: ["date-fns"],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Virtual Analyst',
  },
};

module.exports = nextConfig;
