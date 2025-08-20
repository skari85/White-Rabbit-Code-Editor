# 🔐 GitHub Authentication Setup Guide

## Overview
This guide will help you set up GitHub OAuth authentication for the White Rabbit Code Editor.

## Prerequisites
- GitHub account
- Access to GitHub Developer Settings

## Step 1: Create GitHub OAuth App

### 1.1 Navigate to GitHub Developer Settings
1. Go to [GitHub.com](https://github.com) and sign in
2. Click your profile picture → **Settings**
3. In the left sidebar, click **Developer settings**
4. Click **OAuth Apps**

### 1.2 Create New OAuth App
1. Click **"New OAuth App"**
2. Fill in the application details:

```
Application name: White Rabbit Code Editor
Homepage URL: http://localhost:3012
Application description: A modern code editor with AI assistance
Authorization callback URL: http://localhost:3012/api/auth/callback/github
```

3. Click **"Register application"**

### 1.3 Get Your Credentials
After registration, you'll see:
- **Client ID** (public identifier)
- **Client Secret** (keep this private!)

## Step 2: Update Environment Variables

### 2.1 Edit .env.local
Replace the placeholder values in your `.env.local` file:

```bash
# Current content
NEXTAUTH_SECRET=your-super-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3012
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Replace with your actual values
NEXTAUTH_SECRET=your-super-secret-key-here-change-in-production
NEXTAUTH_URL=http://localhost:3012
GITHUB_CLIENT_ID=abc123def456ghi789
GITHUB_CLIENT_SECRET=xyz789abc123def456
```

### 2.2 Restart Development Server
After updating the environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then restart
npm run dev
```

## Step 3: Test Authentication

### 3.1 Check GitHub Sign-in Button
1. Open the app at `http://localhost:3012`
2. Look for the GitHub sign-in button
3. It should now be visible and functional

### 3.2 Test Sign-in Flow
1. Click **"Sign in with GitHub"**
2. You should be redirected to GitHub for authorization
3. Authorize the application
4. You should be redirected back and signed in

## Troubleshooting

### Issue: Still Getting 404 Errors
**Solution:** Check that:
- Environment variables are properly set
- Development server has been restarted
- No typos in the OAuth app configuration

### Issue: "Invalid redirect URI" Error
**Solution:** Ensure the callback URL in GitHub exactly matches:
```
http://localhost:3012/api/auth/callback/github
```

### Issue: "Client ID not found" Error
**Solution:** Verify:
- Client ID is copied correctly from GitHub
- No extra spaces or characters
- Environment variable is loaded

### Issue: Authentication Works but No User Data
**Solution:** Check that:
- GitHub OAuth app has proper scopes
- User has authorized the application
- Session is properly configured

## Development vs Production

### Development (localhost:3012)
- Uses local OAuth app
- Callback URL: `http://localhost:3012/api/auth/callback/github`
- Environment: `.env.local`

### Production
- Create separate OAuth app for production domain
- Update callback URL to production domain
- Use production environment variables
- Ensure `NEXTAUTH_SECRET` is properly set

## Security Notes

### Never Commit Credentials
- `.env.local` is in `.gitignore`
- Never commit real Client IDs or Secrets
- Use different OAuth apps for dev/prod

### Environment Variables
- Keep `GITHUB_CLIENT_SECRET` private
- Rotate secrets regularly
- Use strong `NEXTAUTH_SECRET` in production

## Fallback Authentication

If GitHub authentication fails, the app includes a demo account for development:

```
Username: demo
Password: demo123
```

This allows you to test the app functionality even without GitHub OAuth.

## Support

If you continue to have issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure the GitHub OAuth app is properly configured
4. Restart the development server after changes

## Next Steps

Once authentication is working:

1. **Test the full flow** - sign in, sign out, session persistence
2. **Explore GitHub integration** - repositories, commits, etc.
3. **Customize the experience** - user profiles, preferences
4. **Deploy to production** - create production OAuth app

---

**Happy coding with White Rabbit! 🐰✨**
