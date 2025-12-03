import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable compression for better performance
  compress: true,
  // Enable experimental features for better performance
  // Note: swcMinify is enabled by default in Next.js 13+ and no longer needs to be specified
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  serverExternalPackages: ["puppeteer-core", "@sparticuz/chromium-min", "axios"],
  // Ensure chromium-min package files (including brotli files) are included only for routes that use puppeteer
  outputFileTracingIncludes: {
    '/api/generate-report/**/*': [
      'node_modules/@sparticuz/chromium-min/**/*',
    ],
  },
  images: {
    // domains is deprecated in Next.js 16 - use remotePatterns instead
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'maps.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Optimize image loading
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Headers for better caching, performance, and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
    ];
  },
  // Webpack config for Leaflet fallbacks (used when --webpack flag is set)
  webpack: (config, { isServer, webpack }) => {
    // Fix for Leaflet in serverless environments
    // Only apply to client builds (not server-side)
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
    
    // Note: Convex API imports are handled dynamically with Function constructor
    // to prevent webpack from trying to resolve them at build time
    
    return config;
  },
  // Turbopack config for Next.js 16 (Turbopack is default in Next.js 16)
  // Add empty config to silence the warning, or migrate webpack config here
  turbopack: {
    // Turbopack handles most cases automatically, but we can add config here if needed
    // For now, empty config allows builds to proceed with Turbopack
    // If you need the webpack fallbacks, use --webpack flag: npm run build:next -- --webpack
  },
  // Path aliases are configured in tsconfig.json
  // Both webpack and Turbopack will automatically use them
};

// Wrap with bundle analyzer if ANALYZE env var is set
let configWithAnalyzer = withBundleAnalyzer(nextConfig);

// Wrap with Sentry config if DSN is provided
export default process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
  ? withSentryConfig(configWithAnalyzer, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
    })
  : configWithAnalyzer;

