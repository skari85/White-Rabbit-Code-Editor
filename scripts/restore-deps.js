#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PIN = {
  tailwindcss: '3.4.0',
  next: '15.5.0',
  react: '19.1.1',
  'react-dom': '19.1.1',
  autoprefixer: '10.4.21',
  postcss: '8.4.49',
  'postcss-import': '16.1.1',
  'postcss-nesting': '13.0.2',
};

const pkgPath = path.join(process.cwd(), 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

function set(depKey, name, ver) {
  if (!pkg[depKey]) return;
  if (name in pkg[depKey]) pkg[depKey][name] = ver;
}

for (const [name, ver] of Object.entries(PIN)) {
  set('dependencies', name, ver);
  set('devDependencies', name, ver);
}

pkg.overrides = pkg.overrides || {};
pkg.overrides.tailwindcss = '3.4.0';

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log('Pinned critical dependencies. Reinstalling…');
execSync('npm install', { stdio: 'inherit' });
console.log('Done.');


