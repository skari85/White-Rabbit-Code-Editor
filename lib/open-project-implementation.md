# Open Project Flow Implementation

Complete client-side "Open Project" workflow using GitHub BYOK token.

## Features

✅ **Repository Selection**
- Browse all user repositories (private + public)
- Search/filter repositories
- Shows repo name, description, visibility, language

✅ **Branch Selection**
- List all branches for selected repo
- Default branch pre-selected
- Shows protected branches

✅ **Project Opening**
- Fetches repository tree recursively
- Builds file tree in UI
- Opens files on click
- All client-side, no backend

✅ **Lightweight Storage**
- Stores only: `{ repo: "owner/repo", branch: "main" }`
- Never stores file contents
- Persists last opened project

## Implementation

### Storage Format

```json
{
  "lastProject": {
    "repo": "owner/repo",
    "branch": "main"
  }
}
```

**Never stored:**
- File contents
- File trees
- Project data
- Tokens (handled separately)

### Component Flow

1. **OpenProjectDialog** - Main dialog component
   - Step 1: Repository selection
   - Step 2: Branch selection
   - Step 3: Loading/opening

2. **GitHubRepoStorage** - Storage management
   - `setLastProject(repo, branch)` - Store reference
   - `getLastProject()` - Get last project
   - `setCurrentRepo(owner, repo, branch)` - Set active repo

3. **GitHubFileTree** - File tree display
   - Listens for storage changes
   - Loads tree when repo is set
   - Displays files/folders

4. **GitHubRepoViewer** - Complete viewer
   - File tree + Monaco editor
   - File loading
   - Commit functionality

## API Calls

All calls go directly from browser → GitHub API:

1. **List Repositories**
   ```
   GET /user/repos?type=all&sort=updated&per_page=100
   ```

2. **List Branches**
   ```
   GET /repos/:owner/:repo/branches
   ```

3. **Get Repository Tree**
   ```
   GET /repos/:owner/:repo/git/trees/:sha?recursive=1
   ```

4. **Get File Contents**
   ```
   GET /repos/:owner/:repo/contents/:path?ref=:branch
   ```

## Usage

### Opening a Project

1. Click "Open" button in sidebar
2. Select repository from list
3. Select branch
4. Project opens automatically

### Integration Points

The OpenProjectDialog integrates with:

- **GitHubRepoStorage** - Stores project reference
- **GitHubFileTree** - Listens for storage changes, loads tree
- **GitHubRepoViewer** - Complete viewer (if used)
- **Monaco Editor** - Loads files for editing

## Code Example

```tsx
import { OpenProjectDialog } from '@/components/open-project-dialog';
import { GitHubRepoStorage } from '@/lib/github-repo-storage';

function MyComponent() {
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <Button onClick={() => setShowDialog(true)}>
        Open Project
      </Button>
      
      <OpenProjectDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onProjectOpen={(repo, branch) => {
          // Project reference stored automatically
          // File tree will load via storage event
          console.log('Opened:', repo, branch);
        }}
      />
    </>
  );
}
```

## Storage Events

When a project is opened, a storage event is dispatched:

```tsx
// In OpenProjectDialog
GitHubRepoStorage.setLastProject(repo, branch);
GitHubRepoStorage.setCurrentRepo(owner, repo, branch);
window.dispatchEvent(new Event('storage'));
```

Components listening for storage changes will automatically update:

```tsx
// In GitHubFileTree
useEffect(() => {
  const handleStorageChange = () => {
    const repo = GitHubRepoStorage.getCurrentRepo();
    if (repo) {
      loadTree(repo.fullName, repo.branch);
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, []);
```

## Acceptance Criteria ✅

- ✅ User can browse their repos
- ✅ Open a repo → choose branch → view tree → open files
- ✅ All via client-side GitHub API calls
- ✅ Nothing saved to our servers
- ✅ Tree loads quickly
- ✅ UI stays minimal / clean
- ✅ Lightweight reference stored: `{ repo, branch }`
- ✅ No file contents stored

## Privacy & Security

✅ **All operations client-side**
- No backend endpoints
- No token proxying
- No server logs

✅ **Minimal storage**
- Only repo/branch reference
- Never file contents
- Never project data

✅ **Direct API calls**
- Browser → GitHub API
- Using user's token from localStorage
- No intermediate servers
