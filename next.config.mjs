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
        buffer: false,
        stream: false,
        util: false,
        assert: false,
        crypto: false,
        path: false,
        os: false,
        url: false,
        querystring: false,
        http: false,
        https: false,
        zlib: false,
        vm: false,
        constants: false,
        domain: false,
        punycode: false,
        process: false,
        events: false,
        string_decoder: false,
        timers: false,
        tty: false,
        _stream_duplex: false,
        _stream_passthrough: false,
        _stream_readable: false,
        _stream_transform: false,
        _stream_writable: false,
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
