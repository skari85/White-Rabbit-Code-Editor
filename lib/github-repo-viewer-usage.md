# GitHub Repository Viewer - Usage Guide

Complete client-side GitHub repository browser with file tree and Monaco editor integration.

## Features

✅ **Read-Only Repository Browsing**
- Browse repositories, branches, and files
- View file tree in sidebar
- Load files into Monaco editor
- All client-side - no backend required

✅ **Smart Storage**
- Only stores repo reference: `{ owner, repo, branch }`
- Never stores file contents server-side
- Files loaded on-demand from GitHub API

✅ **Error Handling**
- Rate limit detection and warnings
- Authentication error handling
- Missing branch/file error messages
- Graceful degradation

## Components

### 1. GitHubRepoViewer
Complete viewer with file tree sidebar and Monaco editor.

```tsx
import { GitHubRepoViewer } from '@/components/github-repo-viewer';

<GitHubRepoViewer className="h-screen" />
```

### 2. GitHubFileTree
Standalone file tree component.

```tsx
import { GitHubFileTree } from '@/components/github-file-tree';

<GitHubFileTree 
  onFileSelect={(path) => console.log('Selected:', path)}
  onRepoChange={(repo) => console.log('Repo changed:', repo)}
/>
```

### 3. GitHubRepoPicker
Repository picker with "Open" button.

```tsx
import { GitHubRepoPicker } from '@/components/github-repo-picker';

<GitHubRepoPicker 
  onOpenRepo={(repo, branch) => {
    // Opens repo in file tree
    GitHubRepoStorage.setCurrentRepo(
      repo.split('/')[0],
      repo.split('/')[1],
      branch
    );
  }}
/>
```

## Usage Flow

### Step 1: Authenticate
```tsx
import { GitHubConnectButton } from '@/components/github-connect-button';

<GitHubConnectButton />
```

### Step 2: Select Repository
User clicks "Open" button on a repository in `GitHubRepoPicker`.

### Step 3: Browse Files
File tree automatically loads and displays repository structure.

### Step 4: Open File
Click a file in the tree → File loads into Monaco editor.

## API

### GitHubRepoStorage

```tsx
import { GitHubRepoStorage } from '@/lib/github-repo-storage';

// Store current repo reference
GitHubRepoStorage.setCurrentRepo('owner', 'repo-name', 'main');

// Get current repo
const repo = GitHubRepoStorage.getCurrentRepo();
// Returns: { owner, repo, branch, fullName }

// Clear current repo
GitHubRepoStorage.clearCurrentRepo();

// Check if repo is open
const isOpen = GitHubRepoStorage.hasCurrentRepo();
```

### useGitHubFileLoader Hook

```tsx
import { useGitHubFileLoader } from '@/hooks/use-github-file-loader';

function MyComponent() {
  const { loadFile, loading, error } = useGitHubFileLoader();

  const handleLoad = async () => {
    const file = await loadFile('src/index.ts');
    if (file) {
      // file: { name, content, type }
      console.log(file.content);
    }
  };

  return (
    <button onClick={handleLoad} disabled={loading}>
      {loading ? 'Loading...' : 'Load File'}
    </button>
  );
}
```

### GitHubClient Methods

```tsx
import { GitHubClient } from '@/lib/github-client';
import { GitHubOAuth } from '@/lib/github-oauth';

const token = GitHubOAuth.getToken();
const client = new GitHubClient(token!);

// Get recursive file tree
const tree = await client.getTree('owner/repo', 'main', true);

// Get file contents (base64 encoded)
const file = await client.getFileContents('owner/repo', 'path/to/file.ts', 'main');

// Decode content
const content = GitHubClient.decodeContent(file.content);
```

## Error Handling

The components handle common errors automatically:

- **Rate Limit Exceeded**: Shows message with reset time
- **Authentication Failed**: Prompts user to reconnect
- **Repository Not Found**: Clear error message
- **File Too Large**: Warns about GitHub's 1MB limit
- **Network Errors**: Generic error message with retry option

## Storage Format

Only repo reference is stored in localStorage:

```json
{
  "github_current_repo": {
    "owner": "username",
    "repo": "repo-name",
    "branch": "main",
    "fullName": "username/repo-name"
  }
}
```

**Never stored:**
- File contents
- File trees
- User tokens (handled by GitHubOAuth)
- Any sensitive data

## Integration Example

Complete integration example:

```tsx
'use client';

import { useState } from 'react';
import { GitHubIntegration } from '@/components/github-integration';
import { GitHubRepoViewer } from '@/components/github-repo-viewer';
import { GitHubOAuth } from '@/lib/github-oauth';

export default function GitHubPage() {
  const [showViewer, setShowViewer] = useState(false);

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Connect Button */}
      <div className="p-4 border-b">
        <GitHubIntegration 
          onOpenRepo={() => setShowViewer(true)}
        />
      </div>

      {/* Repository Viewer */}
      {showViewer && GitHubOAuth.isAuthenticated() && (
        <div className="flex-1">
          <GitHubRepoViewer />
        </div>
      )}
    </div>
  );
}
```

## Limitations

- **Read-Only**: Files cannot be saved back to GitHub (yet)
- **File Size**: GitHub API limits files to 1MB
- **Rate Limits**: 5,000 requests/hour for authenticated users
- **Tree Truncation**: Very large repos may have truncated trees

## Next Steps

To add write capabilities:
1. Implement file update API calls
2. Add commit/push functionality
3. Handle merge conflicts
4. Add branch switching
