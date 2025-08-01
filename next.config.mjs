/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ['@monaco-editor/react', 'lucide-react'],
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize Monaco Editor loading
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };

      // Monaco Editor worker handling
      config.module.rules.push({
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
      });

      // Prevent Monaco workers from causing issues
      config.resolve.alias = {
        ...config.resolve.alias,
        'monaco-editor/esm/vs/editor/editor.worker.js': false,
        'monaco-editor/esm/vs/language/typescript/ts.worker.js': false,
        'monaco-editor/esm/vs/language/json/json.worker.js': false,
        'monaco-editor/esm/vs/language/css/css.worker.js': false,
        'monaco-editor/esm/vs/language/html/html.worker.js': false,
      };
    }
    
    // Fix hot reload issues with Monaco Editor
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules', '**/.next'],
      };
    }
    
    return config;
  },
}

export default nextConfig
