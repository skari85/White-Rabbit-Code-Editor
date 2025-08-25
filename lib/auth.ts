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

// Provide a secret without failing the build; warn for missing prod secret at runtime
const getAuthSecret = () => {
  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.trim() !== '') {
    return process.env.NEXTAUTH_SECRET;
  }

  if (process.env.NODE_ENV === 'production') {
    console.warn('NEXTAUTH_SECRET is not set. Using a fallback secret. Set a strong NEXTAUTH_SECRET in production.');
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
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
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
