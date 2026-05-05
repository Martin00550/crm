import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";
const isAnalyzer = process.env.ANALYZE === "true";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: isAnalyzer,
});

// Get allowed origins from environment variable
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      ...(isProduction ? [] : ['http://localhost:3001', 'http://localhost:3002']),
    ];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.backblazeb2.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.us-west-004.backblazeb2.com",
      },
    ],
  },
  // Security headers for all routes
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // CORS headers
          {
            key: "Access-Control-Allow-Origin",
            value: allowedOrigins.join(', '),
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Requested-With",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400",
          },
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Control referrer information
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Enable XSS protection in browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Control browser features
          { 
            key: "Permissions-Policy", 
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" 
          },
          // Content Security Policy
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://auth.workos.com https://browser.sentry-cdn.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob: https: http:",
              "connect-src 'self' https://api.paddle.com https://sandbox-api.paddle.com https://api.workos.com *.sentry.io",
              "frame-src 'self' https://checkout.paddle.com https://sandbox-checkout.paddle.com https://auth.workos.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              isProduction ? "upgrade-insecure-requests" : "",
            ].filter(Boolean).join("; "),
          },
          // Request size limit to prevent DoS attacks (10MB max)
          { key: "X-Request-Size-Limit", value: "10mb" },
          // Strict Transport Security (HTTPS only)
          isProduction 
            ? { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" }
            : null,
        ].filter(Boolean) as { key: string; value: string }[],
      },
      // Disable caching for API routes
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
  // Disable source maps in production
  productionBrowserSourceMaps: false,
  // Enable strict mode for React
  reactStrictMode: true,
  // Power by header removal for security through obscurity
  poweredByHeader: false,
  // Optimize chunk splitting
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', '@radix-ui/react-dialog'],
  },
  // Split chunks for better caching
  turbopack: {},
};

const sentryOptions = {
  silent: true,
  org: "martin-vasko",
  project: "javascript-nextjs",
};

const sentryConfig = {
  widenClientFileUpload: true,
  transpileClientSDK: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
};

export default withSentryConfig(
  withBundleAnalyzer(nextConfig),
  sentryOptions,
  sentryConfig
);
