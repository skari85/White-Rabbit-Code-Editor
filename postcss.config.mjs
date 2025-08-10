/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    'postcss-import': {},
    tailwindcss: {},
    // 'postcss-nesting': {}, // temporarily disabled until package is installed
    autoprefixer: {},
    // ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {})
  },
};

export default config;
