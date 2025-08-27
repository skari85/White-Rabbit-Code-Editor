// Security configuration for White Rabbit Code Editor
export const SECURITY_CONFIG = {
  // Rate limiting
  RATE_LIMITS: {
    AI_REQUESTS_PER_MINUTE: 20,
    API_REQUESTS_PER_MINUTE: 100,
    FILE_UPLOADS_PER_HOUR: 50
  },

  // File size limits
  FILE_LIMITS: {
    MAX_FILE_SIZE: 1024 * 1024, // 1MB
    MAX_FILES_PER_REQUEST: 50,
    MAX_FILENAME_LENGTH: 255,
    ALLOWED_FILE_TYPES: [
      'html', 'css', 'js', 'ts', 'jsx', 'tsx', 
      'json', 'md', 'txt', 'xml', 'svg'
    ]
  },

  // Content Security Policy
  CSP: {
    PREVIEW: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:;",
    FALLBACK: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
  },

  // Security headers
  HEADERS: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block'
  },

  // Input validation patterns
  VALIDATION: {
    API_KEY_PATTERNS: {
      openai: /^sk-[a-zA-Z0-9]{48,}$/,
      anthropic: /^sk-ant-[a-zA-Z0-9\-_]{95,}$/,
      groq: /^gsk_[a-zA-Z0-9]{52}$/,
      google: /^[a-zA-Z0-9\-_]{39}$/
    },
    FILENAME_PATTERN: /^[a-zA-Z0-9\-_./]+$/,
    PROJECT_NAME_PATTERN: /^[a-zA-Z0-9\-_]{1,50}$/
  }
};

// Sanitize user input
export function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}

// Validate file content
export function validateFileContent(content: string, type: string): boolean {
  if (!content || typeof content !== 'string') return false;
  
  // Check for potentially dangerous content
  const dangerousPatterns = [
    /<script[^>]*>[\s\S]*?<\/script>/gi,
    /javascript:/gi,
    /data:text\/html/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi
  ];

  // Allow scripts only in JS files
  if (type !== 'js' && type !== 'jsx' && type !== 'ts' && type !== 'tsx') {
    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) return false;
    }
  }

  return true;
}

// Rate limiter class
export class RateLimiter {
  private requests: Map<string, { count: number; resetTime: number }> = new Map();

  check(key: string, limit: number, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.requests.get(key);

    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(key: string, limit: number): number {
    const record = this.requests.get(key);
    if (!record || Date.now() > record.resetTime) {
      return limit;
    }
    return Math.max(0, limit - record.count);
  }

  getResetTime(key: string): number {
    const record = this.requests.get(key);
    return record?.resetTime || Date.now();
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();
