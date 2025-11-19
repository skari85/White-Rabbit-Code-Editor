# GitHub OAuth Client-Side Module Usage

This module provides a completely client-side GitHub OAuth implementation using PKCE flow. All tokens are stored in localStorage and never leave the browser.

## Setup

1. Create a GitHub OAuth App:
   - Go to https://github.com/settings/developers
   - Click "New OAuth App"
   - Set Authorization callback URL to: `http://localhost:3012/auth/github-callback` (or your production URL)
   - Copy the Client ID

2. Add to your `.env.local`:
   ```
   NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id_here
   ```

## Basic Usage

```tsx
import { GitHubOAuth } from '@/lib/github-oauth';
import { GitHubConnectButton } from '@/components/github-connect-button';

// In your component:
function MyComponent() {
  return <GitHubConnectButton />;
}
```

## API Reference

### `GitHubOAuth.login()`
Initiates the GitHub OAuth flow. Redirects user to GitHub for authorization.

```tsx
await GitHubOAuth.login();
```

### `GitHubOAuth.handleCallback()`
Handles the OAuth callback after GitHub redirects back. Call this in your callback page.

```tsx
// In app/auth/github-callback/page.tsx
await GitHubOAuth.handleCallback();
```

### `GitHubOAuth.getToken()`
Returns the stored access token, or `null` if not authenticated.

```tsx
const token = GitHubOAuth.getToken();
if (token) {
  // Use token for API requests
}
```

### `GitHubOAuth.getUser()`
Returns the stored user information, or `null` if not authenticated.

```tsx
const user = GitHubOAuth.getUser();
// { login: 'username', name: 'Full Name', avatar_url: '...', email: '...' }
```

### `GitHubOAuth.isAuthenticated()`
Returns `true` if user is authenticated, `false` otherwise.

```tsx
if (GitHubOAuth.isAuthenticated()) {
  // User is logged in
}
```

### `GitHubOAuth.logout()`
Removes the stored token and user data.

```tsx
GitHubOAuth.logout();
```

### `GitHubOAuth.getRepositories()`
Fetches the authenticated user's repositories.

```tsx
const repos = await GitHubOAuth.getRepositories();
```

## Example: Using the Token for API Requests

```tsx
import { GitHubOAuth } from '@/lib/github-oauth';

async function fetchUserRepos() {
  const token = GitHubOAuth.getToken();
  if (!token) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('https://api.github.com/user/repos', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  return response.json();
}
```

## Security Notes

- ✅ Tokens are stored only in localStorage (client-side only)
- ✅ Uses PKCE flow for enhanced security
- ✅ No backend endpoints required
- ✅ No token proxying
- ✅ No server logs of tokens
- ⚠️ Tokens are accessible to JavaScript in the same origin
- ⚠️ Consider token expiration and refresh logic for production use

## Troubleshooting

### CORS Issues
If you encounter CORS errors when exchanging the authorization code:
- Ensure your GitHub OAuth App's callback URL exactly matches your app's callback route
- GitHub's token endpoint should support CORS for PKCE flows from the same origin

### Token Exchange Fails
- Verify `NEXT_PUBLIC_GITHUB_CLIENT_ID` is set correctly
- Check that the callback URL in GitHub matches your app's callback route
- Ensure the code verifier was stored before redirect (check localStorage)
