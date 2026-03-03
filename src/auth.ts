import NextAuth from "next-auth"
import Google from "@auth/core/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google,
  ],
  callbacks: {
    authorized({ auth: _auth, request: { nextUrl: _nextUrl } }) {
      // Basic protection if needed
      return true
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
})
