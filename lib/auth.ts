import NextAuth from "next-auth"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-key-change-in-production",
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token }) {
      return token
    },
    async session({ session }) {
      return session
    },
  },
})
