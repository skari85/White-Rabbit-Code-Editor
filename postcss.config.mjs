import { createRequire } from 'module';
const require = createRequire(import.meta.url);

let hasNesting = false;
try {
  require.resolve('postcss-nesting');
  hasNesting = true;
} catch {}

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    ...(hasNesting ? { 'postcss-nesting': {} } : {}),
    autoprefixer: {},
    // ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  },
};

export default config;
