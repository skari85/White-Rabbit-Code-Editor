/**
 * Coder Space engine tests
 */

import { describe, expect, it } from 'vitest';
import {
  SPACE_TEMPLATES,
  buildPreviewHtml,
  fileTypeFromName,
  parseFilesFromAIResponse,
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
