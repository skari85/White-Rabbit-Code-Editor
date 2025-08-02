import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

// Check if GitHub credentials are available
const hasGitHubCredentials = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: hasGitHubCredentials ? [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ] : [],
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
        token.githubId = profile?.id
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
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === "development",
})
