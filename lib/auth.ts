import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";

// Check if GitHub credentials are available
const hasGitHubCredentials = process.env.GITHUB_CLIENT_ID &&
  process.env.GITHUB_CLIENT_SECRET &&
  process.env.GITHUB_CLIENT_ID.trim() !== '' &&
  process.env.GITHUB_CLIENT_SECRET.trim() !== '' &&
  process.env.GITHUB_CLIENT_ID !== 'your_github_client_id_here' &&
  process.env.GITHUB_CLIENT_SECRET !== 'your_github_client_secret_here';

// Generate a secure secret for production
const getAuthSecret = () => {
  if (process.env.NEXTAUTH_SECRET) {
    return process.env.NEXTAUTH_SECRET;
  }

  // For production, require environment variable
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXTAUTH_SECRET environment variable is required in production');
  }

  return "dev-secret-key-change-in-production";
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
    async signOut() {
      console.log('User signed out');
    },
  },
})
