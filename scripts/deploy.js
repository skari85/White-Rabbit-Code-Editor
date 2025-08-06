#!/usr/bin/env node

/**
 * White Rabbit Code Editor - Deployment Script
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This script handles secure deployment with license verification.
 * For licensing information, see LICENSE file.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🐰 White Rabbit Code Editor - Secure Deployment\n');

// Verify license file exists
if (!fs.existsSync('LICENSE')) {
  console.error('❌ LICENSE file not found. Deployment aborted.');
  process.exit(1);
}

// Verify package.json has correct license
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
if (packageJson.license !== 'SEE LICENSE IN LICENSE') {
  console.error('❌ Invalid license in package.json. Deployment aborted.');
  process.exit(1);
}

// Verify copyright notices are in place
const requiredFiles = [
  'components/code-editor.tsx',
  'components/license-notice.tsx'
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Required file ${file} not found. Deployment aborted.`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('White Rabbit Team. All rights reserved.')) {
    console.error(`❌ Copyright notice missing in ${file}. Deployment aborted.`);
    process.exit(1);
  }
}

console.log('✅ License verification passed');

// Build the application
console.log('🔨 Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful');
} catch (error) {
  console.error('❌ Build failed. Deployment aborted.');
  process.exit(1);
}

// Deploy to Vercel
console.log('🚀 Deploying to Vercel...');
try {
  execSync('npx vercel --prod', { stdio: 'inherit' });
  console.log('✅ Deployment successful');
} catch (error) {
  console.error('❌ Deployment failed.');
  process.exit(1);
}

console.log('\n🎉 White Rabbit Code Editor deployed successfully!');
console.log('📄 Remember: This software is protected by custom license');
console.log('💼 Commercial licensing: licensing@whiterabbit.dev');
