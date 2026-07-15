module.exports = {
  // Format and lint TypeScript/JavaScript files
  '*.{ts,tsx,js,jsx}': [
    'prettier --write',
    'eslint --fix'
  ],
  
  // Format other files
  '*.{json,md,yml,yaml,css,scss,html}': [
    'prettier --write'
  ],
  
  // Type check TypeScript files
  '*.{ts,tsx}': () => 'tsc --noEmit'
};
