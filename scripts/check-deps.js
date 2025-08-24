#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const CRITICAL = {
  tailwindcss: '3.4.0',
  next: '15.2.4',
  react: '19.1.1',
  'react-dom': '19.1.1',
  autoprefixer: '10.4.21',
  postcss: '8.4.49',
  'postcss-import': '16.1.1',
  'postcss-nesting': '13.0.2',
};

function readPkg() {
  const p = path.join(process.cwd(), 'package.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function getVer(pkg, name) {
  return (pkg.dependencies && pkg.dependencies[name]) ||
         (pkg.devDependencies && pkg.devDependencies[name]) ||
         undefined;
}

const pkg = readPkg();
let bad = [];

for (const [name, exact] of Object.entries(CRITICAL)) {
  const cur = getVer(pkg, name);
  if (cur && cur !== exact) bad.push({ name, cur, exact });
}

if (bad.length) {
  console.error('Critical package versions changed:');
  for (const b of bad) console.error(`- ${b.name}: expected ${b.exact}, got ${b.cur}`);
  console.error('\nRun: npm run restore-deps');
  process.exit(1);
} else {
  console.log('All critical packages pinned as expected.');
}


