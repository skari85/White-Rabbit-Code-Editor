/**
 * Coder Space engine tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_PROJECTS,
  SPACE_SYSTEM_PROMPT,
  SPACE_TEMPLATES,
  SpaceProject,
  buildDeployableFiles,
  buildPreviewHtml,
  decodeProjectFromHash,
  encodeProjectToHash,
  fileTypeFromName,
  parseFilesFromAIResponse,
  parseStreamingAIResponse,
  templateToFiles,
  upsertProject,
} from '../lib/space-engine';

function makeProject(id: string, updatedAt: number): SpaceProject {
  return {
    id,
    name: `project-${id}`,
    updatedAt,
    files: [{ name: 'index.html', content: '<h1>x</h1>', type: 'html' }],
  };
}

describe('upsertProject', () => {
  it('inserts new projects newest-first and updates existing in place', () => {
    let list = upsertProject([], makeProject('a', 100));
    list = upsertProject(list, makeProject('b', 200));
    expect(list.map(p => p.id)).toEqual(['b', 'a']);

    list = upsertProject(list, makeProject('a', 300));
    expect(list.map(p => p.id)).toEqual(['a', 'b']);
    expect(list).toHaveLength(2);
  });

  it('caps the list at MAX_PROJECTS, dropping the oldest', () => {
    let list: SpaceProject[] = [];
    for (let i = 0; i < MAX_PROJECTS + 3; i++) {
      list = upsertProject(list, makeProject(`p${i}`, i));
    }
    expect(list).toHaveLength(MAX_PROJECTS);
    expect(list[0].id).toBe(`p${MAX_PROJECTS + 2}`);
    expect(list.some(p => p.id === 'p0')).toBe(false);
  });
});

describe('share link encoding', () => {
  it('round-trips a project including unicode content', async () => {
    const files = [
      {
        name: 'index.html',
        content: '<h1>héllo 🎉</h1>',
        type: 'html' as const,
      },
      {
        name: 'app.js',
        content: 'console.log("π ≈ 3.14");',
        type: 'js' as const,
      },
    ];

    const encoded = await encodeProjectToHash('my ünïcode app', files);
    const decoded = await decodeProjectFromHash(encoded);

    expect(decoded).not.toBeNull();
    expect(decoded?.name).toBe('my ünïcode app');
    expect(decoded?.files).toEqual(files);
  });

  it('returns null for malformed input', async () => {
    expect(await decodeProjectFromHash('garbage')).toBeNull();
    expect(await decodeProjectFromHash('9.notreal')).toBeNull();
    expect(await decodeProjectFromHash('')).toBeNull();
  });
});

describe('SPACE_SYSTEM_PROMPT', () => {
  it('pins the output contract the parser depends on', () => {
    expect(SPACE_SYSTEM_PROMPT).toContain('// index.html');
    expect(SPACE_SYSTEM_PROMPT).toMatch(/COMPLETE/);
    expect(SPACE_SYSTEM_PROMPT).toMatch(/diffs/i);
    expect(SPACE_SYSTEM_PROMPT).toMatch(/module imports/i);
  });
});

describe('parseFilesFromAIResponse', () => {
  it('extracts files with explicit // filename info strings', () => {
    const response = [
      'Here you go:',
      '```html // index.html',
      '<h1>Hi</h1>',
      '```',
      '```css // style.css',
      'h1 { color: red; }',
      '```',
    ].join('\n');

    const files = parseFilesFromAIResponse(response);

    expect(files).toHaveLength(2);
    expect(files[0]).toMatchObject({
      filename: 'index.html',
      code: '<h1>Hi</h1>',
    });
    expect(files[1]).toMatchObject({ filename: 'style.css' });
  });

  it('falls back to conventional filenames when none is given', () => {
    const response = '```javascript\nconsole.log(1);\n```';

    const files = parseFilesFromAIResponse(response);

    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe('app.js');
  });

  it('keeps the last block when the same file appears twice', () => {
    const response = [
      '```js // app.js',
      'const v = 1;',
      '```',
      '```js // app.js',
      'const v = 2;',
      '```',
    ].join('\n');

    const files = parseFilesFromAIResponse(response);

    expect(files).toHaveLength(1);
    expect(files[0].code).toBe('const v = 2;');
  });

  it('ignores empty blocks and unknown languages without filenames', () => {
    const response = '```ruby\nputs 1\n```\n```html // a.html\n\n```';

    expect(parseFilesFromAIResponse(response)).toHaveLength(0);
  });
});

describe('parseStreamingAIResponse', () => {
  it('exposes the currently open block as streaming', () => {
    const partial = 'Sure!\n```js // app.js\nconst a = 1;\nconst b';

    const { files, streaming } = parseStreamingAIResponse(partial);

    expect(files).toHaveLength(0);
    expect(streaming).toMatchObject({
      filename: 'app.js',
      code: 'const a = 1;\nconst b',
    });
  });

  it('moves a block to files once its fence closes', () => {
    const closed = '```js // app.js\nconst a = 1;\n```\nNext up:';

    const { files, streaming } = parseStreamingAIResponse(closed);

    expect(files).toHaveLength(1);
    expect(files[0].filename).toBe('app.js');
    expect(streaming).toBeNull();
  });

  it('handles a second block opening after a completed one', () => {
    const midSecond =
      '```html // index.html\n<h1>Hi</h1>\n```\n```css // style.css\nh1 {';

    const { files, streaming } = parseStreamingAIResponse(midSecond);

    expect(files.map(f => f.filename)).toEqual(['index.html']);
    expect(streaming?.filename).toBe('style.css');
  });

  it('returns no streaming block for prose without fences', () => {
    const { files, streaming } = parseStreamingAIResponse(
      'Let me think about that…'
    );

    expect(files).toHaveLength(0);
    expect(streaming).toBeNull();
  });
});

describe('buildPreviewHtml', () => {
  it('inlines css and js into index.html and strips local references', () => {
    const html = buildPreviewHtml([
      {
        name: 'index.html',
        content:
          '<html><head><link rel="stylesheet" href="style.css"></head>' +
          '<body><script src="app.js"></script></body></html>',
      },
      { name: 'style.css', content: 'body { margin: 0; }' },
      { name: 'app.js', content: 'console.log("hi");' },
    ]);

    expect(html).not.toContain('href="style.css"');
    expect(html).not.toContain('src="app.js"');
    expect(html).toContain('body { margin: 0; }');
    expect(html).toContain('console.log("hi");');
  });

  it('builds a minimal document when there is no index.html', () => {
    const html = buildPreviewHtml([{ name: 'app.js', content: 'let x = 1;' }]);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('let x = 1;');
  });

  it('injects the console bridge before project scripts in both paths', () => {
    const withIndex = buildPreviewHtml([
      {
        name: 'index.html',
        content: '<html><head></head><body></body></html>',
      },
      { name: 'app.js', content: 'console.log("x");' },
    ]);
    const withoutIndex = buildPreviewHtml([
      { name: 'app.js', content: 'console.log("x");' },
    ]);

    for (const html of [withIndex, withoutIndex]) {
      expect(html).toContain('wr-console');
      expect(html.indexOf('wr-console')).toBeLessThan(
        html.indexOf('console.log("x")')
      );
    }
  });
});

describe('templates', () => {
  it('every template previews to a runnable document', () => {
    for (const template of SPACE_TEMPLATES) {
      const files = templateToFiles(template);
      expect(files.length).toBeGreaterThan(0);
      const html = buildPreviewHtml(files);
      expect(html).toContain('<html');
    }
  });

  it('template files carry correct types', () => {
    expect(fileTypeFromName('index.html')).toBe('html');
    expect(fileTypeFromName('style.css')).toBe('css');
    expect(fileTypeFromName('app.js')).toBe('js');
  });
});

describe('buildDeployableFiles', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn(async () => ({
      arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
    })) as unknown as typeof fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('adds a manifest, service worker, and bundled icons, and wires them into index.html', async () => {
    const files = [
      {
        name: 'index.html',
        content:
          '<html><head></head><body><script src="app.js"></script></body></html>',
        type: 'html' as const,
        lastModified: new Date(),
      },
      {
        name: 'app.js',
        content: 'console.log("hi");',
        type: 'js' as const,
        lastModified: new Date(),
      },
    ];

    const out = await buildDeployableFiles(files, 'My Test App');
    const names = out.map(f => f.name);

    expect(names).toEqual(
      expect.arrayContaining([
        'index.html',
        'app.js',
        'manifest.json',
        'sw.js',
        'icon-192.png',
        'icon-512.png',
        'apple-touch-icon.png',
      ])
    );

    const manifest = JSON.parse(
      out.find(f => f.name === 'manifest.json')!.content
    );
    expect(manifest.name).toBe('My Test App');
    expect(manifest.icons).toHaveLength(2);

    const html = out.find(f => f.name === 'index.html')!.content;
    expect(html).toContain('<link rel="manifest" href="manifest.json">');
    expect(html).toContain("navigator.serviceWorker.register('sw.js')");

    const icon = out.find(f => f.name === 'icon-192.png')!;
    expect(icon.encoding).toBe('base64');
  });
});
