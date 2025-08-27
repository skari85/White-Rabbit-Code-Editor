import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Credentials from "next-auth/providers/credentials"

// Check if GitHub credentials are available
const hasGitHubCredentials = process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_SECRET &&
  process.env.GITHUB_CLIENT_ID.trim() !== '' &&
  process.env.GITHUB_CLIENT_SECRET.trim() !== '' &&
  process.env.GITHUB_CLIENT_ID !== 'your_github_client_id_here' &&
  process.env.GITHUB_CLIENT_SECRET !== 'your_github_client_secret_here';

// Generate a secret or fall back gracefully to avoid build-time failures
const getAuthSecret = () => {
  const secretFromEnv = process.env.NEXTAUTH_SECRET;
  if (secretFromEnv && secretFromEnv.trim() !== '') {
    return secretFromEnv;
  }

  // In production, avoid throwing during build. Warn and fall back to a deterministic secret.
  // IMPORTANT: For real production, set NEXTAUTH_SECRET in your environment to a strong value.
  if (process.env.NODE_ENV === 'production') {
    console.warn('NEXTAUTH_SECRET is not set. Using a fallback secret. Set NEXTAUTH_SECRET in production.');
    const fallback = 'fallback-secret-change-me';
    return fallback;
  }

  // Development fallback
  return 'dev-secret-key-change-in-production';
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    // GitHub OAuth provider (only if credentials are properly configured)
    ...(hasGitHubCredentials ? [
      GitHub({
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        authorization: {
          params: {
            scope: 'read:user user:email repo',
          },
        },
      })
    ] : []),
    
    // Fallback credentials provider for development/testing
    ...(process.env.NODE_ENV === 'development' ? [
      Credentials({
        name: 'Demo Account',
        credentials: {
          username: { label: "Username", type: "text", placeholder: "demo" },
          password: { label: "Password", type: "password", placeholder: "demo123" }
        },
        async authorize(credentials) {
          // Simple demo authentication
          if (credentials?.username === 'demo' && credentials?.password === 'demo123') {
            return {
              id: 'demo-user',
              name: 'Demo User',
              email: 'demo@whiterabbit.dev',
              image: '/placeholder-user.jpg',
            }
          }
          return null
        }
      })
    ] : [])
  ],
  
  secret: getAuthSecret(),
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        if (profile?.id) {
          token.githubId = profile.id
        }
      }
      return token
    },
    
    async session({ session, token }) {
      // Send properties to the client, like an access_token and user id from a provider.
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }
      if (token.githubId) {
        session.user.githubId = token.githubId as string
      }
      return session
    },
    
    async redirect({ url, baseUrl }) {
      // Normalize to absolute URL for checks
      let target = url
      try {
        if (url.startsWith('/')) target = new URL(url, baseUrl).toString()
      } catch {}
      try {
        const u = new URL(target)
        const path = u.pathname
        const authPaths = ['/auth/signin', '/auth/error', '/api/auth/signin']
        // After successful sign-in or if redirecting to root/landing, send users to the editor
        if (path === '/' || path === '/landing' || authPaths.includes(path)) {
          return `${baseUrl}/enter`
        }
        // Same-origin URLs are allowed as-is
        if (u.origin === baseUrl) return u.toString()
      } catch {}
      // Fallback: go to editor
      return `${baseUrl}/enter`
    },
  },
  
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  debug: process.env.NODE_ENV === "development",
  
  // Add helpful error messages
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User signed in: ${user.email} via ${account?.provider}`);
    },
    async signOut({ session, token }) {
      console.log('User signed out');
    },
    async error(error) {
      console.error('NextAuth error:', error);
    },
  },
})
