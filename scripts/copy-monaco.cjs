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

// The "min" build's .js files reference maps under a sibling "min-maps"
// directory we don't copy (it's tens of MB and only useful for debugging
// Monaco's own source, not our app). Left in place, browsers request those
// .map URLs and get 404s in the console. Strip the trailing
// `//# sourceMappingURL=...` comment so nothing is requested.
const sourceMapCommentRe = /\n\/\/# sourceMappingURL=.*\.map\s*$/;
let strippedCount = 0;
(function stripSourceMaps(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      stripSourceMaps(entryPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const contents = fs.readFileSync(entryPath, 'utf8');
      const stripped = contents.replace(sourceMapCommentRe, '');
      if (stripped !== contents) {
        fs.writeFileSync(entryPath, stripped);
        strippedCount++;
      }
    }
  }
})(dest);

console.log(`✅ Copied Monaco Editor static build to ${path.relative(process.cwd(), dest)} (stripped sourceMappingURL from ${strippedCount} files)`);
