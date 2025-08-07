# 🚀 White Rabbit Code Editor - Production Setup Guide

## 🚨 Current Issue
Your production site `https://www.whiterabbit.onl` is showing an application error because:
1. GitHub OAuth is configured for localhost, not production domain
2. Environment variables are missing in Vercel
3. NextAuth URL is set to localhost instead of production

## 🔧 Step-by-Step Fix

### Step 1: Update GitHub OAuth App
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Find your OAuth App (Client ID: `Ov23liB8oYjzPvmlNM23`)
3. Click **"Edit"** and update:
   - **Application name**: `White Rabbit Code Editor`
   - **Homepage URL**: `https://www.whiterabbit.onl`
   - **Authorization callback URL**: `https://www.whiterabbit.onl/api/auth/callback/github`
4. Click **"Update application"**

### Step 2: Add Environment Variables to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `white-rabbit-code-editor` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
NEXTAUTH_URL = https://your-domain.com
NEXTAUTH_SECRET = your-secure-random-secret-key-here-make-it-very-long-and-random
GITHUB_CLIENT_ID = your_github_client_id_here
GITHUB_CLIENT_SECRET = your_github_client_secret_here
```

### Step 3: Optional - Add AI API Keys
If you want AI features to work in production, also add:
```
GROQ_API_KEY = your_actual_groq_api_key
OPENAI_API_KEY = your_actual_openai_api_key
ANTHROPIC_API_KEY = your_actual_anthropic_api_key
```

### Step 4: Redeploy
After adding environment variables:
1. Go to **Deployments** tab in Vercel
2. Click **"Redeploy"** on the latest deployment
3. Or push a new commit to trigger automatic deployment

## ✅ Expected Result
After these changes:
- ✅ Site loads without application error
- ✅ GitHub authentication works
- ✅ "Welcome to White Rabbit" appears correctly
- ✅ White Rabbit logo displays properly

## 🔍 Troubleshooting
If you still see errors:
1. Check browser console for specific error messages
2. Verify all environment variables are set in Vercel
3. Ensure GitHub OAuth callback URL exactly matches: `https://www.whiterabbit.onl/api/auth/callback/github`
4. Wait 1-2 minutes after redeployment for changes to take effect

## 📞 Need Help?
If you're still having issues, share the browser console error message and I can help debug further!
