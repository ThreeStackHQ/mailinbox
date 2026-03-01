/**
 * auth.ts — Placeholder until Sprint 1.6 (Authentication Setup) is complete.
 *
 * Sprint 1.6 (Bolt) will replace this with a full NextAuth v5 Credentials
 * provider + bcryptjs setup, matching the RecoverHub/SecretVault pattern.
 *
 * The `auth()` function here returns null session so protected routes
 * correctly return 401 until auth is wired up.
 */

import NextAuth from "next-auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = String(user.id ?? "");
        token.email = String(user.email ?? "");
        token.name = user.name ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.email = (token.email ?? "") as string;
        session.user.name = (token.name as string | null | undefined) ?? null;
      }
      return session;
    },
  },
});

/**
 * TODO (Sprint 1.6 — Bolt):
 * - Add Credentials provider with bcryptjs password verification
 * - Add Zod validation (loginSchema)
 * - Add db lookup from @mailinbox/db
 * - Add rate limiting middleware
 */
