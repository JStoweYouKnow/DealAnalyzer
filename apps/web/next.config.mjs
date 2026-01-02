import { withSentryConfig } from "@sentry/nextjs";
import bundleAnalyzer from "@next/bundle-analyzer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable compression for better performance
  compress: true,
  // Ensure dependencies from other workspace packages are traced correctly
  outputFileTracingRoot: path.join(__dirname, '../../'),
  // Exclude large folders from tracing to avoid package size issues
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@next/swc-linux-x64-gnu',
      'node_modules/@next/swc-linux-x64-musl',
      'node_modules/@esbuild/linux-x64',
    ],
  },
  // Transpile workspace packages
  transpilePackages: [
    '@dealanalyzer/types',
    '@dealanalyzer/utils',
    '@dealanalyzer/ui',
    '@dealanalyzer/storage',
    '@dealanalyzer/external-apis',
    '@dealanalyzer/ai-services',
    '@dealanalyzer/analysis-engine',
    '@dealanalyzer/config',
  ],
  // Enable experimental features for better performance
  // Note: swcMinify is enabled by default in Next.js 13+ and no longer needs to be specified
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    // Optimize package imports - tree-shake large libraries
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      // All Radix UI components
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      // Other heavy packages
      'recharts',
      'react-day-picker',
      'framer-motion',
      'date-fns',
      'react-hook-form',
      '@tanstack/react-query',
    ],
  },
  serverExternalPackages: [
    "puppeteer-core", 
    "@sparticuz/chromium-min"
  ],
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
          // CORS headers for mobile app support
          // Note: Can't use '*' with credentials, so we'll handle CORS in middleware/API routes
          // For mobile apps, we don't need CORS (same-origin policy doesn't apply)
          // But we add these for web compatibility
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, x-user-id, x-user-session-id',
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

