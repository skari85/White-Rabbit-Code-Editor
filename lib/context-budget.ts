// Picks which project files (and how much of each) fit within a rough
// character budget before handing everything to an AI provider. Without
// this, concatenating every file's full content into every request means a
// project with a few real files plus a small-context model just hard-fails
// once the request exceeds that model's context window, with no
// truncation and a confusing raw provider error (e.g. Groq's
// context_length_exceeded).
//
// There's no cross-provider tokenizer available here, so character count is
// used as a conservative proxy for tokens (~4 chars/token for typical
// English/code text) rather than an exact count — the goal is staying
// comfortably clear of a hard failure, not maximizing how much fits.
export const DEFAULT_MAX_CONTEXT_CHARS = 40000;

export interface BudgetedFile {
  name: string;
  content: string;
}

export interface ContextBudgetResult<T extends BudgetedFile> {
  /** Files to include, in their original order — possibly truncated. */
  included: T[];
  /** Names of files left out entirely to stay within budget. */
  omitted: string[];
  wasTrimmed: boolean;
}

/**
 * `priorityName`, if given (typically the currently selected/edited file),
 * is packed first and kept whole whenever it fits at all. Everything else
 * is added in original order until the budget runs out, then the first
 * file that doesn't fully fit gets truncated with a note and everything
 * after it is omitted.
 */
export function budgetFilesForContext<T extends BudgetedFile>(
  files: T[],
  maxChars: number = DEFAULT_MAX_CONTEXT_CHARS,
  priorityName?: string
): ContextBudgetResult<T> {
  if (files.length === 0) {
    return { included: [], omitted: [], wasTrimmed: false };
  }

  const totalChars = files.reduce((sum, f) => sum + f.content.length, 0);
  if (totalChars <= maxChars) {
    return { included: files, omitted: [], wasTrimmed: false };
  }

  const ordered = priorityName
    ? [
        ...files.filter(f => f.name === priorityName),
        ...files.filter(f => f.name !== priorityName),
      ]
    : files;

  let remaining = maxChars;
  const includedByName = new Map<string, T>();
  const omitted: string[] = [];

  for (const file of ordered) {
    if (remaining <= 0) {
      omitted.push(file.name);
      continue;
    }
    if (file.content.length <= remaining) {
      includedByName.set(file.name, file);
      remaining -= file.content.length;
    } else {
      const shown = file.content.slice(0, remaining);
      const hiddenChars = file.content.length - remaining;
      includedByName.set(file.name, {
        ...file,
        content: `${shown}\n/* … truncated to fit the AI's context window, ${hiddenChars} more characters not shown … */`,
      });
      remaining = 0;
    }
  }

  const included = files
    .filter(f => includedByName.has(f.name))
    .map(f => includedByName.get(f.name)!);

  return { included, omitted, wasTrimmed: true };
}

/** A short note to append to a prompt when files were left out entirely. */
export function omittedFilesNote(omitted: string[]): string {
  if (omitted.length === 0) return '';
  return `\n\n(${omitted.length} additional file${omitted.length === 1 ? '' : 's'} omitted to fit the AI's context window: ${omitted.join(', ')})`;
}
