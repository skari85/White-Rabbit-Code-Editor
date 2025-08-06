#!/usr/bin/env node

/**
 * White Rabbit Code Editor - License Header Script
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This script adds license headers to source files.
 * For licensing information, see LICENSE file.
 */

const fs = require('fs');
const path = require('path');

const LICENSE_HEADER = `/**
 * White Rabbit Code Editor
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

`;

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = ['node_modules', '.next', '.git', 'dist', 'build'];
const EXCLUDE_FILES = ['next.config.js', 'tailwind.config.js', 'postcss.config.js'];

function shouldProcessFile(filePath) {
  const ext = path.extname(filePath);
  const fileName = path.basename(filePath);
  
  if (!EXTENSIONS.includes(ext)) return false;
  if (EXCLUDE_FILES.includes(fileName)) return false;
  
  const pathParts = filePath.split(path.sep);
  return !pathParts.some(part => EXCLUDE_DIRS.includes(part));
}

function hasLicenseHeader(content) {
  return content.includes('White Rabbit Code Editor') && content.includes('Copyright (c) 2025');
}

function addLicenseHeader(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (hasLicenseHeader(content)) {
      console.log(`✓ ${filePath} (already has header)`);
      return;
    }
    
    const newContent = LICENSE_HEADER + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`+ ${filePath} (header added)`);
  } catch (error) {
    console.error(`✗ ${filePath} (error: ${error.message})`);
  }
}

function processDirectory(dir) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !EXCLUDE_DIRS.includes(item)) {
      processDirectory(fullPath);
    } else if (stat.isFile() && shouldProcessFile(fullPath)) {
      addLicenseHeader(fullPath);
    }
  }
}

console.log('🐰 White Rabbit Code Editor - Adding License Headers\n');
processDirectory('.');
console.log('\n✅ License headers processing complete!');
