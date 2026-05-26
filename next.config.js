/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,  // Disable SWC minification for Windows compatibility
  output: 'standalone',
  // Skip lint/type-check workers in next build — they hang in OneDrive dirs on Windows.
  // Run `npm run type-check` separately for type safety.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  compiler: {
    removeConsole: false
  },
  env: {
    NEXT_PUBLIC_APP_NAME: 'Virtual Analyst',
  },
};

module.exports = nextConfig;
