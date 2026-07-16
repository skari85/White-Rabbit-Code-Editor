/**
 * Coder Space engine tests
 */

import { describe, expect, it } from 'vitest';
import {
  SPACE_TEMPLATES,
  buildPreviewHtml,
  fileTypeFromName,
  parseFilesFromAIResponse,
  parseStreamingAIResponse,
  templateToFiles,
} from '../lib/space-engine';

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
