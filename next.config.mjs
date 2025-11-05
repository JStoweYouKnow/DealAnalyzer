/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min"],
  // Ensure chromium-min package files (including brotli files) are included in deployment
  outputFileTracingIncludes: {
    '/api/**/*': [
      'node_modules/@sparticuz/chromium-min/**/*',
    ],
  },
  images: {
    domains: ['images.unsplash.com', 'maps.googleapis.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for Leaflet in serverless environments
    if (!isServer) {
      // Handle Leaflet's Node.js dependencies for client-side builds
      // These modules are not available in browser/serverless environments
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  // Path aliases are configured in tsconfig.json
  // Webpack will automatically use them
};

export default nextConfig;

