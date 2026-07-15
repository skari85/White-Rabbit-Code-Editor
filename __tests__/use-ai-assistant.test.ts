/**
 * useAIAssistant localStorage resilience tests
 */

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAIAssistant } from '../hooks/use-ai-assistant';
import { DEFAULT_AI_SETTINGS } from '../lib/ai-config';

const STORAGE_KEY = 'hex-kex-ai-settings';
const MESSAGES_STORAGE_KEY = 'hex-kex-ai-messages';

describe('useAIAssistant localStorage resilience', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to defaults when saved settings/messages are corrupted JSON', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(
      (key: string) => {
        if (key === STORAGE_KEY) return '{not valid json';
        if (key === MESSAGES_STORAGE_KEY) return '[also not valid';
        return null;
      }
    );
    const removeItemSpy = vi
      .spyOn(window.localStorage, 'removeItem')
      .mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useAIAssistant());

    expect(result.current.settings).toEqual(DEFAULT_AI_SETTINGS);
    expect(result.current.messages).toEqual([]);
    expect(result.current.isConfigured).toBe(false);
    expect(removeItemSpy).toHaveBeenCalledWith(STORAGE_KEY);
    expect(removeItemSpy).toHaveBeenCalledWith(MESSAGES_STORAGE_KEY);
  });

  it('loads valid saved settings without error', () => {
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(
      (key: string) => {
        if (key === STORAGE_KEY)
          return JSON.stringify({ ...DEFAULT_AI_SETTINGS, provider: 'groq' });
        return null;
      }
    );

    const { result } = renderHook(() => useAIAssistant());

    expect(result.current.settings.provider).toBe('groq');
  });
});
