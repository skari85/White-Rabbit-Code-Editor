/**
 * Vitest Setup for White Rabbit Code Editor
 * Privacy-first testing configuration
 */

import { cleanup } from '@testing-library/react';
import { beforeAll, vi } from 'vitest';

// Mock environment for privacy-first testing
beforeAll(() => {
  // Mock process.env to avoid leaking sensitive data in tests
  vi.stubEnv('NODE_ENV', 'test');

  // Mock localStorage to prevent test interference
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock sessionStorage
  const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  };
  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
  });

  // Mock navigator for privacy
  Object.defineProperty(window, 'navigator', {
    value: {
      userAgent: 'Test Browser',
      clipboard: {
        writeText: vi.fn().mockResolvedValue(true),
        readText: vi.fn().mockResolvedValue(''),
      },
    },
    writable: true,
  });

  // Mock ResizeObserver (common source of test failures)
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Clean up after each test
  cleanup();
});

// Global test utilities for privacy-first testing
const testUtils = {
  // Helper to mock file operations safely
  createMockFile: (name: string, content: string, type = 'txt') => ({
    name,
    content,
    type: type as any,
    lastModified: new Date(),
    id: `mock-${name}`,
  }),

  // Helper to mock AI responses without logging sensitive data
  mockAISuccess: (responseText: string) => ({
    success: true,
    data: { message: responseText },
  }),

  mockAIFailure: (errorMessage: string = 'AI service unavailable') => ({
    success: false,
    error: errorMessage,
  }),

  // Helper to create mock session without exposing real user data
  createMockSession: (userOverrides = {}) => ({
    user: {
      id: 'test-user',
      name: 'Test User',
      email: 'test@example.com',
      ...userOverrides,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }),
};

// Assign to global for testing
(global as any).testUtils = testUtils;

// Export global types
declare global {
  var testUtils: {
    createMockFile: (name: string, content: string, type?: string) => any;
    mockAISuccess: (responseText: string) => { success: true; data: { message: string } };
    mockAIFailure: (errorMessage?: string) => { success: false; error: string };
    createMockSession: (userOverrides?: any) => any;
  };
}
