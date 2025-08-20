import { NextRequest, NextResponse } from 'next/server';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Input validation schemas
interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'regex';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

interface ValidationSchema {
  [key: string]: ValidationRule;
}

// Security headers configuration
interface SecurityHeaders {
  'X-Frame-Options'?: string;
  'X-Content-Type-Options'?: string;
  'X-XSS-Protection'?: string;
  'Referrer-Policy'?: string;
  'Content-Security-Policy'?: string;
  'Strict-Transport-Security'?: string;
  'Permissions-Policy'?: string;
}

class SecurityService {
  private rateLimitStore: RateLimitStore = {};
  private defaultRateLimit: RateLimitConfig = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  };

  // Rate limiting middleware
  rateLimit(config: Partial<RateLimitConfig> = {}) {
    const finalConfig = { ...this.defaultRateLimit, ...config };
    
    return (request: NextRequest) => {
      const clientId = this.getClientId(request);
      const now = Date.now();
      
      // Clean up expired entries
      this.cleanupRateLimitStore(now);
      
      // Get or create client record
      if (!this.rateLimitStore[clientId]) {
        this.rateLimitStore[clientId] = {
          count: 0,
          resetTime: now + finalConfig.windowMs
        };
      }
      
      const client = this.rateLimitStore[clientId];
      
      // Check if window has reset
      if (now > client.resetTime) {
        client.count = 0;
        client.resetTime = now + finalConfig.windowMs;
      }
      
      // Check rate limit
      if (client.count >= finalConfig.maxRequests) {
        return NextResponse.json(
          { error: 'Too many requests', retryAfter: Math.ceil((client.resetTime - now) / 1000) },
          { status: 429, headers: { 'Retry-After': Math.ceil((client.resetTime - now) / 1000).toString() } }
        );
      }
      
      // Increment counter
      client.count++;
      
      return null; // Continue to next middleware
    };
  }

  // Get client identifier (IP address or user ID)
  private getClientId(request: NextRequest): string {
    // Try to get real IP from various headers
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    let clientIp = request.ip || 'unknown';
    
    if (forwarded) {
      clientIp = forwarded.split(',')[0].trim();
    } else if (realIp) {
      clientIp = realIp;
    } else if (cfConnectingIp) {
      clientIp = cfConnectingIp;
    }
    
    // Add user agent for more granular rate limiting
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${clientIp}:${this.hashString(userAgent)}`;
  }

  // Clean up expired rate limit entries
  private cleanupRateLimitStore(now: number) {
    Object.keys(this.rateLimitStore).forEach(key => {
      if (this.rateLimitStore[key].resetTime < now) {
        delete this.rateLimitStore[key];
      }
    });
  }

  // Simple string hashing for user agent
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Input validation
  validateInput(data: any, schema: ValidationSchema): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    for (const [field, rule] of Object.entries(schema)) {
      const value = data[field];
      
      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      // Skip validation for undefined/null values if not required
      if (value === undefined || value === null) {
        continue;
      }
      
      // Type validation
      if (!this.validateType(value, rule.type)) {
        errors.push(`${field} must be of type ${rule.type}`);
        continue;
      }
      
      // Length validation for strings
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`${field} must be at least ${rule.minLength} characters long`);
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`${field} must be no more than ${rule.maxLength} characters long`);
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push(`${field} format is invalid`);
        }
      }
      
      // Range validation for numbers
      if (rule.type === 'number' && typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${field} must be no more than ${rule.max}`);
        }
      }
      
      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push(`${field} validation failed`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Type validation
  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      case 'regex':
        return true; // Regex validation is handled separately
      default:
        return true;
    }
  }

  // Sanitize input to prevent XSS
  sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input;
    
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Sanitize HTML content
  sanitizeHTML(html: string): string {
    if (typeof html !== 'string') return html;
    
    // Remove potentially dangerous tags and attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<[^>]*\s+style\s*=\s*["'][^"']*["'][^>]*>/gi, '');
  }

  // Generate security headers
  generateSecurityHeaders(): SecurityHeaders {
    return {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': this.generateCSP(),
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
    };
  }

  // Generate Content Security Policy
  private generateCSP(): string {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.github.com https://vercel.com",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];
    
    return csp.join('; ');
  }

  // Apply security headers to response
  applySecurityHeaders(response: NextResponse): NextResponse {
    const headers = this.generateSecurityHeaders();
    
    Object.entries(headers).forEach(([key, value]) => {
      if (value) {
        response.headers.set(key, value);
      }
    });
    
    return response;
  }

  // Validate file upload
  validateFileUpload(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const { maxSize = 10 * 1024 * 1024, allowedTypes = [], allowedExtensions = [] } = options;
    
    // Check file size
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
    }
    
    // Check MIME type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }
    
    // Check file extension
    if (allowedExtensions.length > 0) {
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        errors.push(`File extension .${extension} is not allowed`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Generate CSRF token
  generateCSRFToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  // Validate CSRF token
  validateCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken;
  }

  // Check for suspicious patterns
  detectSuspiciousPatterns(input: string): { isSuspicious: boolean; patterns: string[] } {
    const suspiciousPatterns = [
      /<script\b[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i,
      /eval\s*\(/i,
      /document\.cookie/i,
      /window\.location/i,
      /\.\.\/\.\.\//, // Directory traversal
      /union\s+select/i, // SQL injection
      /<iframe\b[^>]*>/i,
      /<object\b[^>]*>/i
    ];
    
    const foundPatterns: string[] = [];
    
    suspiciousPatterns.forEach((pattern, index) => {
      if (pattern.test(input)) {
        foundPatterns.push(`Pattern ${index + 1} detected`);
      }
    });
    
    return {
      isSuspicious: foundPatterns.length > 0,
      patterns: foundPatterns
    };
  }

  // Rate limit for specific endpoints
  createEndpointRateLimit(endpoint: string, config: Partial<RateLimitConfig> = {}) {
    const endpointConfig = {
      ...this.defaultRateLimit,
      ...config,
      windowMs: config.windowMs || 60 * 1000, // Default 1 minute for endpoints
      maxRequests: config.maxRequests || 30 // Default 30 requests per minute
    };
    
    return this.rateLimit(endpointConfig);
  }

  // Get rate limit status for a client
  getRateLimitStatus(clientId: string): { count: number; remaining: number; resetTime: number } | null {
    const client = this.rateLimitStore[clientId];
    if (!client) return null;
    
    const now = Date.now();
    if (now > client.resetTime) {
      return { count: 0, remaining: this.defaultRateLimit.maxRequests, resetTime: now + this.defaultRateLimit.windowMs };
    }
    
    return {
      count: client.count,
      remaining: Math.max(0, this.defaultRateLimit.maxRequests - client.count),
      resetTime: client.resetTime
    };
  }
}

// Export singleton instance
export const securityService = new SecurityService();

// Export middleware functions
export const rateLimit = (config?: Partial<RateLimitConfig>) => securityService.rateLimit(config);
export const endpointRateLimit = (endpoint: string, config?: Partial<RateLimitConfig>) => 
  securityService.createEndpointRateLimit(endpoint, config);

// Export validation functions
export const validateInput = (data: any, schema: ValidationSchema) => 
  securityService.validateInput(data, schema);

export const sanitizeInput = (input: string) => securityService.sanitizeInput(input);
export const sanitizeHTML = (html: string) => securityService.sanitizeHTML(html);

// Export security utilities
export const applySecurityHeaders = (response: NextResponse) => 
  securityService.applySecurityHeaders(response);

export const validateFileUpload = (file: File, options?: any) => 
  securityService.validateFileUpload(file, options);

export const generateCSRFToken = () => securityService.generateCSRFToken();
export const validateCSRFToken = (token: string, storedToken: string) => 
  securityService.validateCSRFToken(token, storedToken);

export const detectSuspiciousPatterns = (input: string) => 
  securityService.detectSuspiciousPatterns(input);

// Predefined validation schemas
export const commonSchemas = {
  email: {
    email: { type: 'email' as const, required: true }
  },
  username: {
    username: { 
      type: 'string' as const, 
      required: true, 
      minLength: 3, 
      maxLength: 20,
      pattern: /^[a-zA-Z0-9_-]+$/
    }
  },
  password: {
    password: { 
      type: 'string' as const, 
      required: true, 
      minLength: 8,
      custom: (value: string) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)
    }
  },
  fileUpload: {
    filename: { type: 'string' as const, required: true, maxLength: 255 },
    size: { type: 'number' as const, required: true, min: 0, max: 50 * 1024 * 1024 } // 50MB max
  }
};
