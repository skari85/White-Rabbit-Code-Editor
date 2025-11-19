# GitHub Client Usage Guide

The `GitHubClient` class provides a lightweight, client-side interface to the GitHub API. All requests go directly from the browser to GitHub - no backend required.

## Setup

The client requires a GitHub access token from localStorage (obtained via OAuth):

```tsx
import { GitHubClient } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';

const token = GitHubOAuth.getToken();
if (token) {
  const client = new GitHubClient(token);
  // Use client...
}
```

## API Methods

### `listRepos(options?)`
List repositories with pagination and filtering options.

```tsx
// Get first 100 repos, sorted by update date
const repos = await client.listRepos({
  type: 'all',        // 'all' | 'owner' | 'member'
  sort: 'updated',    // 'created' | 'updated' | 'pushed' | 'full_name'
  direction: 'desc',  // 'asc' | 'desc'
  per_page: 100,
  page: 1
});
```

### `listAllRepos()`
Get all repositories (handles pagination automatically).

```tsx
const allRepos = await client.listAllRepos();
```

### `listBranches(repo)`
List branches for a repository.

```tsx
// repo can be "owner/repo" or just "repo" (assumes current user)
const branches = await client.listBranches('username/repo-name');
// or
const branches = await client.listBranches('repo-name');
```

### `listFiles(repo, branch?, path?)`
List files in a repository branch.

```tsx
// List root files
const files = await client.listFiles('username/repo-name', 'main');

// List files in a directory
const files = await client.listFiles('username/repo-name', 'main', 'src/components');
```

### `getFileContents(repo, path, branch?)`
Get the contents of a file.

```tsx
const file = await client.getFileContents('username/repo-name', 'README.md', 'main');
// Returns: { content: string (base64), encoding: string, size: number }
```

### `getRepo(repo)`
Get repository details.

```tsx
const repo = await client.getRepo('username/repo-name');
```

### `getUser()`
Get authenticated user information.

```tsx
const user = await client.getUser();
// Returns: { login, name, avatar_url, email }
```

### `getRateLimit()`
Get current rate limit information.

```tsx
const rateLimit = client.getRateLimit();
// Returns: { limit: number, remaining: number, reset: number, used: number }
```

## Rate Limits

GitHub API has rate limits:
- **Authenticated requests**: 5,000 requests/hour
- **Unauthenticated requests**: 60 requests/hour

The client automatically:
- Tracks rate limit info from response headers
- Shows helpful error messages when rate limit is exceeded
- Displays remaining API calls in the UI

## Error Handling

The client throws descriptive errors for common scenarios:

```tsx
try {
  const repos = await client.listRepos();
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Handle rate limit
  } else if (error.message.includes('Authentication failed')) {
    // Token expired or invalid
  } else {
    // Other error
  }
}
```

## Complete Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import { GitHubClient } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';

export function MyComponent() {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    const token = GitHubOAuth.getToken();
    if (!token) {
      setError('Not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const client = new GitHubClient(token);
      const allRepos = await client.listAllRepos();
      setRepos(allRepos);
      
      // Check rate limit
      const rateLimit = client.getRateLimit();
      console.log(`API calls remaining: ${rateLimit?.remaining}/${rateLimit?.limit}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Repositories ({repos.length})</h2>
      {repos.map(repo => (
        <div key={repo.id}>
          <h3>{repo.name}</h3>
          <p>{repo.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## UI Components

Pre-built components are available:

- **`GitHubConnectButton`** - Connect/disconnect button with user menu
- **`GitHubRepoPicker`** - Full-featured repo browser with branches and files
- **`GitHubIntegration`** - Combined component (button + picker)

```tsx
import { GitHubIntegration } from '@/components/github-integration';

<GitHubIntegration showRepoPicker={true} />
```
