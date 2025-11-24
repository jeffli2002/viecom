import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import path from 'path';
import './src/env';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const config: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '50mb',
    },
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  serverExternalPackages: ['@aws-sdk/client-s3'],
  // Note: standalone output requires admin privileges on Windows for symlinks
  // To build with standalone on Windows:
  // 1. Run PowerShell as Administrator, OR
  // 2. Enable Developer Mode in Windows Settings
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname),
  webpack: (config, { isServer }) => {
    // Ensure proper module resolution
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    // Ignore problematic directories during build
    if (!config.resolve.modules) {
      config.resolve.modules = ['node_modules'];
    }
    // Exclude problematic directories from module resolution
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.(ts|tsx|js|jsx)$/,
      exclude: [
        /node_modules/,
        /FigmaMockup/,
        /压缩/,
        /AI Image_Video Generator/,
      ],
    });
    return config;
  },
};

export default withBundleAnalyzer(withNextIntl(config));

