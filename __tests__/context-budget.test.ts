import { describe, expect, it } from 'vitest';
import { budgetFilesForContext, omittedFilesNote } from '../lib/context-budget';

describe('budgetFilesForContext', () => {
  it('returns everything unchanged when under budget', () => {
    const files = [
      { name: 'a.js', content: 'const a = 1;' },
      { name: 'b.js', content: 'const b = 2;' },
    ];

    const result = budgetFilesForContext(files, 1000);

    expect(result.wasTrimmed).toBe(false);
    expect(result.omitted).toEqual([]);
    expect(result.included).toEqual(files);
  });

  it('truncates the first file that overflows and omits the rest', () => {
    const files = [
      { name: 'a.js', content: 'A'.repeat(10) },
      { name: 'b.js', content: 'B'.repeat(10) },
      { name: 'c.js', content: 'C'.repeat(10) },
    ];

    const result = budgetFilesForContext(files, 15);

    expect(result.wasTrimmed).toBe(true);
    expect(result.included.map(f => f.name)).toEqual(['a.js', 'b.js']);
    expect(result.included[0].content).toBe('A'.repeat(10));
    expect(result.included[1].content).toContain('B'.repeat(5));
    expect(result.included[1].content).toContain('truncated');
    expect(result.omitted).toEqual(['c.js']);
  });

  it('packs the priority file first and keeps it whole whenever it fits', () => {
    const files = [
      { name: 'big.js', content: 'X'.repeat(20) },
      { name: 'selected.js', content: 'Y'.repeat(10) },
    ];

    const result = budgetFilesForContext(files, 15, 'selected.js');

    // Priority file is packed first and kept whole even though it appears
    // second in the original file order.
    const selected = result.included.find(f => f.name === 'selected.js');
    expect(selected?.content).toBe('Y'.repeat(10));
    // Only 5 chars remained for big.js, so it's truncated rather than
    // dropped entirely.
    const big = result.included.find(f => f.name === 'big.js');
    expect(big?.content).toContain('truncated');
    expect(result.omitted).toEqual([]);
  });

  it('produces no note when nothing was omitted', () => {
    expect(omittedFilesNote([])).toBe('');
  });

  it('lists omitted filenames in the note', () => {
    const note = omittedFilesNote(['a.js', 'b.js']);
    expect(note).toContain('a.js');
    expect(note).toContain('b.js');
    expect(note).toContain('2 additional files');
  });
});
