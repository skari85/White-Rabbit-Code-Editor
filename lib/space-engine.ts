/**
 * White Rabbit Code Editor - Coder Space engine
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 *
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 *
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

import { FileContent } from '@/hooks/use-code-builder';

export interface SpaceTemplate {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  files: Array<Pick<FileContent, 'name' | 'content' | 'type'>>;
}

export interface ParsedAIFile {
  filename: string;
  language: string;
  code: string;
}

// Same fence convention the AI chat uses: ```lang // filename.ext
const CODE_BLOCK_REGEX = /```(\w+)?\s*(?:\/\/\s*(.+?)\s*)?\n([\s\S]*?)```/g;

const DEFAULT_FILENAMES: Record<string, string> = {
  html: 'index.html',
  css: 'style.css',
  javascript: 'app.js',
  js: 'app.js',
  typescript: 'app.ts',
  ts: 'app.ts',
  json: 'data.json',
  markdown: 'README.md',
  md: 'README.md',
  python: 'main.py',
  py: 'main.py',
};

export function fileTypeFromName(name: string): FileContent['type'] {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'jsx':
      return 'js';
    case 'ts':
      return 'ts';
    case 'tsx':
      return 'tsx';
    case 'json':
      return 'json';
    case 'md':
      return 'md';
    case 'py':
      return 'py';
    default:
      return 'txt';
  }
}

export function monacoLanguageFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    default:
      return 'plaintext';
  }
}

/**
 * Extract complete files from an AI response. Blocks without an explicit
 * `// filename` comment fall back to a conventional name for their language;
 * unnamed blocks of the same language overwrite each other (last wins),
 * matching how the existing AI chat applies generated code.
 */
export function parseFilesFromAIResponse(response: string): ParsedAIFile[] {
  const byName = new Map<string, ParsedAIFile>();
  let match: RegExpExecArray | null;

  CODE_BLOCK_REGEX.lastIndex = 0;
  while ((match = CODE_BLOCK_REGEX.exec(response)) !== null) {
    const language = (match[1] || 'text').toLowerCase();
    const code = match[3].trim();
    if (!code) continue;

    const explicitName = match[2]?.trim();
    const filename =
      explicitName && explicitName.includes('.')
        ? explicitName
        : DEFAULT_FILENAMES[language];
    if (!filename) continue;

    byName.set(filename, { filename, language, code });
  }

  return Array.from(byName.values());
}

/**
 * Combine project files into a single self-contained HTML document for a
 * sandboxed iframe preview. Local stylesheet/script references are replaced
 * by inlining the actual file contents, so the preview needs no server.
 */
export function buildPreviewHtml(
  files: Array<Pick<FileContent, 'name' | 'content'>>
): string {
  const html = files.find(f => f.name.toLowerCase() === 'index.html');
  const cssFiles = files.filter(f => f.name.toLowerCase().endsWith('.css'));
  const jsFiles = files.filter(f => f.name.toLowerCase().endsWith('.js'));

  const styleTag = cssFiles.length
    ? `<style>\n${cssFiles.map(f => f.content).join('\n')}\n</style>`
    : '';
  const scriptTag = jsFiles.length
    ? `<script>\n${jsFiles.map(f => f.content).join('\n')}\n</script>`
    : '';

  if (!html) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8">${styleTag}</head><body>${scriptTag}</body></html>`;
  }

  let doc = html.content;

  // Drop references to local files we are about to inline.
  for (const f of [...cssFiles, ...jsFiles]) {
    const name = f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    doc = doc
      .replace(
        new RegExp(`<link[^>]*href=["'](?:\\./)?${name}["'][^>]*>`, 'gi'),
        ''
      )
      .replace(
        new RegExp(
          `<script[^>]*src=["'](?:\\./)?${name}["'][^>]*>\\s*</script>`,
          'gi'
        ),
        ''
      );
  }

  if (styleTag) {
    doc = doc.includes('</head>')
      ? doc.replace('</head>', `${styleTag}\n</head>`)
      : styleTag + doc;
  }
  if (scriptTag) {
    doc = doc.includes('</body>')
      ? doc.replace('</body>', `${scriptTag}\n</body>`)
      : doc + scriptTag;
  }

  return doc;
}

export const SPACE_TEMPLATES: SpaceTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    tagline: 'Empty page, no opinions',
    icon: '⬜',
    files: [
      {
        name: 'index.html',
        type: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>My App</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Hello, world</h1>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        type: 'css',
        content: `body {
  font-family: system-ui, sans-serif;
  margin: 2rem;
}`,
      },
      { name: 'app.js', type: 'js', content: `console.log('ready');` },
    ],
  },
  {
    id: 'landing',
    name: 'Landing Page',
    tagline: 'Hero, features, call to action',
    icon: '🚀',
    files: [
      {
        name: 'index.html',
        type: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Launchpad</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="hero">
    <h1>Ship something great</h1>
    <p>A clean starting point for your next landing page.</p>
    <button id="cta">Get started</button>
  </header>
  <section class="features">
    <article><h2>Fast</h2><p>Loads in a blink.</p></article>
    <article><h2>Simple</h2><p>No framework required.</p></article>
    <article><h2>Yours</h2><p>Edit anything, instantly.</p></article>
  </section>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        type: 'css',
        content: `* { box-sizing: border-box; margin: 0; }
body { font-family: system-ui, sans-serif; color: #eaeaea; background: #0d0d0d; }
.hero { padding: 6rem 2rem; text-align: center; background: linear-gradient(135deg, #6c2fff33, #00ffe122); }
.hero h1 { font-size: 2.5rem; margin-bottom: .5rem; }
.hero p { color: #7a7a7a; margin-bottom: 1.5rem; }
#cta { background: #6c2fff; color: white; border: none; padding: .75rem 2rem; border-radius: 999px; font-size: 1rem; cursor: pointer; }
#cta:hover { background: #5a1fe0; }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 2rem; }
.features article { background: #161616; border: 1px solid #262626; border-radius: 12px; padding: 1.5rem; }
.features h2 { font-size: 1.1rem; margin-bottom: .5rem; color: #00ffe1; }`,
      },
      {
        name: 'app.js',
        type: 'js',
        content: `document.getElementById('cta').addEventListener('click', () => {
  alert('Time to build!');
});`,
      },
    ],
  },
  {
    id: 'game',
    name: 'Snake Game',
    tagline: 'Playable canvas game',
    icon: '🎮',
    files: [
      {
        name: 'index.html',
        type: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Snake</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <h1>Snake</h1>
    <p>Arrow keys to move · <span id="score">0</span> points</p>
    <canvas id="game" width="300" height="300"></canvas>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        type: 'css',
        content: `body { display: grid; place-items: center; min-height: 100vh; margin: 0; background: #0d0d0d; color: #eaeaea; font-family: system-ui, sans-serif; }
main { text-align: center; }
p { color: #7a7a7a; }
#score { color: #00ffe1; }
canvas { border: 2px solid #6c2fff; border-radius: 8px; background: #161616; }`,
      },
      {
        name: 'app.js',
        type: 'js',
        content: `const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const CELL = 15, SIZE = 20;
let snake = [{ x: 10, y: 10 }], dir = { x: 1, y: 0 }, food = { x: 5, y: 5 }, score = 0;

document.addEventListener('keydown', e => {
  const turns = { ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 } };
  const t = turns[e.key];
  if (t && (t.x !== -dir.x || t.y !== -dir.y)) dir = t;
});

function tick() {
  const head = { x: (snake[0].x + dir.x + SIZE) % SIZE, y: (snake[0].y + dir.y + SIZE) % SIZE };
  if (snake.some(s => s.x === head.x && s.y === head.y)) {
    snake = [{ x: 10, y: 10 }]; dir = { x: 1, y: 0 }; score = 0;
  } else {
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score += 10;
      food = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
    } else {
      snake.pop();
    }
  }
  document.getElementById('score').textContent = score;
  ctx.fillStyle = '#161616';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ff3c75';
  ctx.fillRect(food.x * CELL, food.y * CELL, CELL - 1, CELL - 1);
  ctx.fillStyle = '#00ffe1';
  snake.forEach(s => ctx.fillRect(s.x * CELL, s.y * CELL, CELL - 1, CELL - 1));
}
setInterval(tick, 120);`,
      },
    ],
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    tagline: 'Stats, cards, and a chart',
    icon: '📊',
    files: [
      {
        name: 'index.html',
        type: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dashboard</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Weekly Overview</h1>
  <section class="cards">
    <article><h2 id="visits">—</h2><p>Visits</p></article>
    <article><h2 id="signups">—</h2><p>Signups</p></article>
    <article><h2 id="revenue">—</h2><p>Revenue</p></article>
  </section>
  <canvas id="chart" width="600" height="200"></canvas>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        type: 'css',
        content: `body { font-family: system-ui, sans-serif; background: #0d0d0d; color: #eaeaea; padding: 2rem; }
.cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1.5rem 0; }
.cards article { background: #161616; border: 1px solid #262626; border-radius: 12px; padding: 1.25rem; }
.cards h2 { color: #00ffe1; margin: 0 0 .25rem; }
.cards p { color: #7a7a7a; margin: 0; font-size: .85rem; }
canvas { width: 100%; max-width: 600px; background: #161616; border-radius: 12px; }`,
      },
      {
        name: 'app.js',
        type: 'js',
        content: `const data = [42, 61, 55, 78, 90, 84, 103];
document.getElementById('visits').textContent = data.reduce((a, b) => a + b, 0).toLocaleString();
document.getElementById('signups').textContent = Math.round(data.at(-1) * 0.4);
document.getElementById('revenue').textContent = '$' + (data.at(-1) * 12).toLocaleString();

const ctx = document.getElementById('chart').getContext('2d');
const W = 600, H = 200, max = Math.max(...data);
ctx.fillStyle = '#161616';
ctx.fillRect(0, 0, W, H);
data.forEach((v, i) => {
  const barW = W / data.length - 12;
  const barH = (v / max) * (H - 30);
  ctx.fillStyle = i === data.length - 1 ? '#00ffe1' : '#6c2fff';
  ctx.fillRect(i * (W / data.length) + 6, H - barH - 10, barW, barH);
});`,
      },
    ],
  },
  {
    id: 'pomodoro',
    name: 'Pomodoro Timer',
    tagline: 'Focus timer with sessions',
    icon: '⏱️',
    files: [
      {
        name: 'index.html',
        type: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Pomodoro</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <p id="mode">Focus</p>
    <h1 id="clock">25:00</h1>
    <div class="controls">
      <button id="toggle">Start</button>
      <button id="reset">Reset</button>
    </div>
    <p class="sessions">Sessions done: <span id="count">0</span></p>
  </main>
  <script src="app.js"></script>
</body>
</html>`,
      },
      {
        name: 'style.css',
        type: 'css',
        content: `body { display: grid; place-items: center; min-height: 100vh; margin: 0; background: #0d0d0d; color: #eaeaea; font-family: system-ui, sans-serif; }
main { text-align: center; }
#mode { color: #00ffe1; letter-spacing: .2em; text-transform: uppercase; font-size: .8rem; }
#clock { font-size: 5rem; margin: .5rem 0 1.5rem; font-variant-numeric: tabular-nums; }
.controls { display: flex; gap: .75rem; justify-content: center; }
button { border: none; border-radius: 999px; padding: .6rem 1.8rem; font-size: 1rem; cursor: pointer; }
#toggle { background: #6c2fff; color: white; }
#toggle:hover { background: #5a1fe0; }
#reset { background: #161616; color: #7a7a7a; border: 1px solid #262626; }
.sessions { color: #7a7a7a; margin-top: 2rem; font-size: .85rem; }`,
      },
      {
        name: 'app.js',
        type: 'js',
        content: `const FOCUS = 25 * 60, BREAK = 5 * 60;
let remaining = FOCUS, running = false, onBreak = false, sessions = 0, timer = null;

const clock = document.getElementById('clock');
const mode = document.getElementById('mode');
const toggle = document.getElementById('toggle');

function render() {
  const m = String(Math.floor(remaining / 60)).padStart(2, '0');
  const s = String(remaining % 60).padStart(2, '0');
  clock.textContent = m + ':' + s;
  mode.textContent = onBreak ? 'Break' : 'Focus';
  toggle.textContent = running ? 'Pause' : 'Start';
  document.getElementById('count').textContent = sessions;
}

function tick() {
  if (--remaining > 0) return render();
  if (!onBreak) sessions++;
  onBreak = !onBreak;
  remaining = onBreak ? BREAK : FOCUS;
  render();
}

toggle.addEventListener('click', () => {
  running = !running;
  if (running) timer = setInterval(tick, 1000);
  else clearInterval(timer);
  render();
});

document.getElementById('reset').addEventListener('click', () => {
  clearInterval(timer);
  running = false; onBreak = false; remaining = FOCUS;
  render();
});

render();`,
      },
    ],
  },
];

export function templateToFiles(template: SpaceTemplate): FileContent[] {
  return template.files.map(f => ({ ...f, lastModified: new Date() }));
}
