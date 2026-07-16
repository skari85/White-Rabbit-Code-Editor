#!/usr/bin/env node
/**
 * Copies Monaco Editor's static AMD build (node_modules/monaco-editor/min/vs)
 * into public/monaco-vs so the editor can be self-hosted from our own origin
 * instead of @monaco-editor/react's default CDN loader (jsdelivr) — which
 * fails outright behind restrictive networks or ad-blockers.
 *
 * Runs automatically after `npm install` (see package.json) and is safe to
 * re-run any time; it always mirrors the current node_modules copy.
 */
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'node_modules', 'monaco-editor', 'min', 'vs');
const dest = path.join(__dirname, '..', 'public', 'monaco-vs', 'vs');

if (!fs.existsSync(src)) {
  console.warn('⚠️  monaco-editor/min/vs not found — skipping copy (run npm install first).');
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log(`✅ Copied Monaco Editor static build to ${path.relative(process.cwd(), dest)}`);
