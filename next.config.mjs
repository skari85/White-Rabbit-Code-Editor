/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: process.env.CI === 'true',
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@monaco-editor/react', 'lucide-react'],
  },
  webpack: (config, { dev, isServer }) => {
    // Basic Monaco Editor support
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
}

export default nextConfig
