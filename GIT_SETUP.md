# Git Integration Setup Guide

## Prerequisites

1. **GitHub Account** - You need a GitHub account
2. **GitHub Repository** - A repository to push your code to
3. **GitHub Personal Access Token** - For API access

## Step 1: Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Give it a name like "White Rabbit Code Editor"
4. Select scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. **Copy the token** - you won't see it again!

## Step 2: Configure Environment Variables

Create a `.env.local` file in your project root:

```bash
# GitHub Integration
GITHUB_REPO=your-username/your-repo-name
GITHUB_TOKEN=ghp_your_token_here
GITHUB_DEFAULT_BRANCH=main

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3012
NEXTAUTH_SECRET=your-secret-key-here

# GitHub OAuth App (optional, for authentication)
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
```

## Step 3: Test Git Integration

1. Start your development server: `npm run dev`
2. Open the app and go to the **Git** tab
3. Click "Test Git Connection" to verify your setup
4. Try basic git commands like `git status`, `git init`

## Step 4: Use Git Features

### Local Git Commands
- **Init**: Initialize a new git repository
- **Status**: Check repository status
- **Add All**: Stage all changes
- **Branch**: List branches
- **Log**: View commit history

### GitHub Integration
- **Commit to GitHub**: Push changes directly to your repository
- **Push**: Push local commits to remote

## Troubleshooting

### Common Issues

1. **"Missing GITHUB_REPO"**
   - Make sure `.env.local` exists and has `GITHUB_REPO=owner/repo`

2. **"Missing GITHUB_TOKEN"**
   - Verify your token is correct in `.env.local`
   - Check if token has expired or been revoked

3. **"GitHub API error 401"**
   - Invalid or expired token
   - Token doesn't have required scopes

4. **"GitHub API error 404"**
   - Repository doesn't exist
   - Repository is private and token doesn't have access

### Debug Steps

1. Check environment variables are loaded:
   ```bash
   echo $GITHUB_REPO
   echo $GITHUB_TOKEN
   ```

2. Test GitHub API manually:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        https://api.github.com/repos/YOUR_REPO
   ```

3. Check browser console for detailed error messages

## Security Notes

- **Never commit `.env.local`** to version control
- **Rotate tokens regularly** for security
- **Use minimal required scopes** for your token
- **Consider using GitHub Apps** for production use

## Advanced Configuration

### Custom Git Hooks
You can add custom git hooks in your repository:
- `pre-commit`: Run tests before commit
- `post-commit`: Deploy after commit
- `pre-push`: Validate before push

### Multiple Repositories
To work with multiple repositories, you can:
1. Change `GITHUB_REPO` in `.env.local`
2. Use different branches with `GITHUB_DEFAULT_BRANCH`
3. Set up multiple environment files for different projects

## Support

If you're still having issues:
1. Check the browser console for error messages
2. Verify your GitHub token permissions
3. Ensure your repository exists and is accessible
4. Check the terminal for any server-side errors
