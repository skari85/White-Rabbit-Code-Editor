'use client';

const TOKEN_STORAGE_KEY = 'white-rabbit:github-token';
const CODE_VERIFIER_KEY = 'white-rabbit:github-code-verifier';
const OAUTH_STATE_KEY = 'white-rabbit:github-oauth-state';
const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
const DEFAULT_SCOPE = 'read:user repo';

const isBrowser = () => typeof window !== 'undefined';

const getClientId = () => process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || '';
const getClientSecret = () => process.env.NEXT_PUBLIC_GITHUB_CLIENT_SECRET;
const getRedirectUri = () => {
  if (process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_GITHUB_REDIRECT_URI;
  }

  if (isBrowser()) {
    return window.location.origin;
  }

  return '';
};

const getScope = () => process.env.NEXT_PUBLIC_GITHUB_SCOPE || DEFAULT_SCOPE;

const base64UrlEncode = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return window
    .btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const generateRandomString = (length = 64) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const result: string[] = [];
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  randomValues.forEach((value) => {
    result.push(charset[value % charset.length]);
  });
  return result.join('');
};

const generateCodeChallenge = async (verifier: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
};

const stripOauthParamsFromUrl = () => {
  if (!isBrowser()) return;
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  const searchString = url.searchParams.toString();
  const cleanUrl = `${url.pathname}${searchString ? `?${searchString}` : ''}${url.hash}`;
  window.history.replaceState({}, document.title, cleanUrl);
};

const exchangeCodeForToken = async (code: string, codeVerifier: string) => {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error('Missing NEXT_PUBLIC_GITHUB_CLIENT_ID');
  }

  const redirectUri = getRedirectUri();
  if (!redirectUri) {
    throw new Error('Missing redirect URI');
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });

  const clientSecret = getClientSecret();
  if (clientSecret) {
    body.set('client_secret', clientSecret);
  }

  const response = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    throw new Error('GitHub token request failed');
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error_description || 'GitHub token exchange error');
  }

  return data.access_token as string;
};

const GitHubOAuth = {
  async login() {
    if (!isBrowser()) return;

    const clientId = getClientId();
    if (!clientId) {
      throw new Error('Missing NEXT_PUBLIC_GITHUB_CLIENT_ID');
    }

    const redirectUri = getRedirectUri();
    if (!redirectUri) {
      throw new Error('Missing redirect URI');
    }

    const codeVerifier = generateRandomString(96);
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(32);

    sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
    sessionStorage.setItem(OAUTH_STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: getScope(),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      response_type: 'code',
    });

    window.location.href = `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
  },

  async handleRedirectCallback() {
    if (!isBrowser()) return false;

    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (!code && !error) {
      return false;
    }

    try {
      if (error) {
        const description = url.searchParams.get('error_description');
        throw new Error(description || error);
      }

      const storedState = sessionStorage.getItem(OAUTH_STATE_KEY);
      if (!returnedState || !storedState || returnedState !== storedState) {
        throw new Error('OAuth state mismatch');
      }

      const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY);
      if (!codeVerifier) {
        throw new Error('Missing PKCE code verifier');
      }

      const accessToken = await exchangeCodeForToken(code, codeVerifier);
      if (!accessToken) {
        throw new Error('GitHub did not return an access token');
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
      return true;
    } finally {
      sessionStorage.removeItem(CODE_VERIFIER_KEY);
      sessionStorage.removeItem(OAUTH_STATE_KEY);
      stripOauthParamsFromUrl();
    }
  },

  logout() {
    if (!isBrowser()) return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  },

  getToken() {
    if (!isBrowser()) return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  },

  isAuthenticated() {
    return Boolean(GitHubOAuth.getToken());
  },
};

export default GitHubOAuth;
