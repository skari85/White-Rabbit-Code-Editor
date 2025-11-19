# GitHub Commit & Push Implementation

Complete client-side GitHub commit functionality - all operations go directly from browser to GitHub API.

## Features

✅ **Single File Quick Save**
- Click "Save" button to commit current file immediately
- Uses default commit message: "Update {filename}"
- Shows toast notification: "Committed to GitHub"

✅ **Multi-File Commits**
- Click "Commit" button to commit all modified files
- Custom commit message dialog
- Branch selection
- Shows file list being committed

✅ **Change Tracking**
- Tracks original file content vs current content
- Shows "X unsaved changes" indicator
- Only commits files that have actually changed

✅ **Error Handling**
- Rate limit detection
- Authentication errors
- Merge conflict detection
- Missing permissions
- Network errors

✅ **Branch Management**
- Switch branches
- Create new branches
- Branch switcher in toolbar

## Implementation Details

### File Change Detection

```tsx
// Track original content when file is loaded
originalFilesRef.current.set(file.name, file.content);

// Detect changes
const modified = files.filter(file => {
  const original = originalFilesRef.current.get(file.name);
  return original !== undefined && original !== file.content;
});
```

### Quick Save (Single File)

```tsx
// Get file SHA for update
const sha = await client.getFileSha(repo, path, branch);

// Commit file
await client.createOrUpdateFile(
  repo,
  path,
  content,
  `Update ${path}`,
  branch,
  sha
);

// Update original content
originalFilesRef.current.set(path, content);
```

### Multi-File Commit

```tsx
// Get all modified files
const modified = getModifiedFiles();

// Commit each file with SHA
for (const file of modified) {
  const sha = await client.getFileSha(repo, file.path, branch);
  await client.createOrUpdateFile(
    repo,
    file.path,
    file.content,
    commitMessage,
    branch,
    sha
  );
}
```

## API Methods Used

### GitHubClient.createOrUpdateFile()
```tsx
await client.createOrUpdateFile(
  repo: string,        // "owner/repo"
  path: string,        // "src/index.ts"
  content: string,     // File content (will be base64 encoded)
  message: string,     // Commit message
  branch: string,      // "main"
  sha?: string         // File SHA for updates (optional for new files)
);
```

### GitHubClient.getFileSha()
```tsx
const sha = await client.getFileSha(
  repo: string,
  path: string,
  branch: string
);
// Returns SHA if file exists, null otherwise
```

## UI Components

### GitHubRepoViewer
- Main viewer component with file tree + Monaco editor
- Toolbar with Save/Commit buttons
- Branch switcher
- Change indicator

### GitHubCommitDialog
- Modal dialog for multi-file commits
- Commit message input
- Branch selection
- File list display
- Progress indicators

### GitHubBranchSwitcher
- Dropdown to switch branches
- Create new branch button
- Branch refresh

## Usage Flow

1. **User opens file** → File loaded from GitHub, original content stored
2. **User edits file** → Changes tracked in Monaco editor
3. **User clicks "Save"** → Single file committed with default message
4. **OR User clicks "Commit"** → Dialog opens for multi-file commit
5. **Commit succeeds** → Toast notification shown, original content updated
6. **Commit fails** → Error toast with specific message

## Privacy & Security

✅ **All operations client-side**
- No backend endpoints
- No token proxying
- No server logs

✅ **Token storage**
- Stored only in localStorage
- Never sent to White Rabbit servers
- Used directly for GitHub API calls

✅ **No data storage**
- File contents never stored server-side
- Only repo reference stored: `{ owner, repo, branch }`
- All operations in-memory

## Error Handling

### Rate Limit
```tsx
if (errorMessage.includes('rate limit')) {
  toast.error('GitHub API rate limit exceeded', {
    description: 'Please try again later',
  });
}
```

### Authentication
```tsx
if (errorMessage.includes('Authentication failed')) {
  toast.error('Authentication failed', {
    description: 'Please reconnect to GitHub',
  });
}
```

### Merge Conflict
```tsx
if (errorMessage.includes('merge conflict')) {
  toast.error('Merge conflict detected', {
    description: 'Please pull latest changes first',
  });
}
```

## Toast Notifications

Using `sonner` library:

```tsx
import { toast } from 'sonner';

// Success
toast.success('Committed to GitHub', {
  description: 'File has been saved',
});

// Error
toast.error('Failed to save file', {
  description: errorMessage,
});

// Info
toast.info('No changes to save');
```

## Example Usage

```tsx
import { GitHubRepoViewer } from '@/components/github-repo-viewer';

// Complete viewer with commit functionality
<GitHubRepoViewer className="h-screen" />
```

## Success Criteria ✅

- ✅ User can edit files in Monaco editor
- ✅ Changes are tracked automatically
- ✅ Single file quick save works
- ✅ Multi-file commit with custom message works
- ✅ All commits go directly to GitHub API
- ✅ No backend involvement
- ✅ Toast notifications for success/error
- ✅ Error handling for common scenarios
- ✅ Branch switching works
- ✅ No data stored server-side
