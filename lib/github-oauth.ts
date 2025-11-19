/**
 * GitHub OAuth Module - Client-Side Only
 * 
 * This module implements GitHub OAuth using PKCE flow.
 * All tokens are stored in localStorage and never leave the browser.
 * No backend endpoints, no token proxying, no server logs.
 */

const STORAGE_KEY_TOKEN = 'github_access_token';
const STORAGE_KEY_USER = 'github_user';
const STORAGE_KEY_CODE_VERIFIER = 'github_code_verifier';

// GitHub OAuth configuration
const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const GITHUB_API_URL = 'https://api.github.com';
const REDIRECT_URI = typeof window !== 'undefined' 
  ? `${window.location.origin}/auth/github-callback`
  : '';

/**
 * Generate a random string for PKCE code verifier
 */
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Generate code challenge from verifier using SHA256
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * GitHub OAuth Module
 */
export class GitHubOAuth {
  /**
   * Initiate GitHub OAuth login flow
   */
  static async login(): Promise<void> {
    if (!GITHUB_CLIENT_ID) {
      throw new Error('GitHub Client ID is not configured. Please set NEXT_PUBLIC_GITHUB_CLIENT_ID environment variable.');
    }

    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // Store code verifier for later use
    localStorage.setItem(STORAGE_KEY_CODE_VERIFIER, codeVerifier);

    // Build authorization URL
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: 'read:user user:email repo',
      response_type: 'code',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    const authUrl = `${GITHUB_AUTH_URL}?${params.toString()}`;
    
    // Redirect to GitHub
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback and exchange code for token
   */
  static async handleCallback(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    // Extract authorization code from URL
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('GitHub OAuth error:', error);
      return false;
    }

    if (!code) {
      return false;
    }

    // Get stored code verifier
    const codeVerifier = localStorage.getItem(STORAGE_KEY_CODE_VERIFIER);
    if (!codeVerifier) {
      console.error('Code verifier not found');
      return false;
    }

    try {
      // Exchange authorization code for access token
      // GitHub expects form-urlencoded data, not JSON
      const params = new URLSearchParams({
        client_id: GITHUB_CLIENT_ID,
        code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      });

      const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${tokenResponse.status} - ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      
      if (tokenData.error) {
        throw new Error(tokenData.error_description || tokenData.error);
      }

      const accessToken = tokenData.access_token;
      
      if (!accessToken) {
        throw new Error('No access token received');
      }

      // Store token in localStorage
      localStorage.setItem(STORAGE_KEY_TOKEN, accessToken);

      // Clean up code verifier
      localStorage.removeItem(STORAGE_KEY_CODE_VERIFIER);

      // Fetch user info
      await this.fetchUserInfo(accessToken);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      return true;
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      localStorage.removeItem(STORAGE_KEY_CODE_VERIFIER);
      return false;
    }
  }

  /**
   * Fetch user information from GitHub API
   */
  static async fetchUserInfo(token: string): Promise<void> {
    try {
      const response = await fetch(`${GITHUB_API_URL}/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user info: ${response.status}`);
      }

      const userData = await response.json();
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to fetch user info:', error);
      // Don't throw - token is still valid even if user info fetch fails
    }
  }

  /**
   * Get stored access token
   */
  static getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    return localStorage.getItem(STORAGE_KEY_TOKEN);
  }

  /**
   * Get stored user information
   */
  static getUser(): { login: string; name: string; avatar_url: string; email?: string } | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const userStr = localStorage.getItem(STORAGE_KEY_USER);
    if (!userStr) {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return this.getToken() !== null;
  }

  /**
   * Logout - remove token and user data
   */
  static logout(): void {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_CODE_VERIFIER);
  }

  /**
   * Get user's repositories
   */
  static async getRepositories(): Promise<any[]> {
    const token = this.getToken();
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch(`${GITHUB_API_URL}/user/repos?sort=updated&per_page=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch repositories: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      throw error;
    }
  }
}
