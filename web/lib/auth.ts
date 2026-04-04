import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { supabase, type UserRole } from "./supabase";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          hd: "turing.com",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/bigquery",
          ].join(" "),
          prompt: "consent",
          access_type: "offline",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }

      // On sign-in (account is present), upsert user and fetch role
      if (account && profile?.email) {
        const { data } = await supabase
          .from("users")
          .upsert(
            {
              email: profile.email,
              name: (profile as { name?: string }).name ?? null,
              google_id: profile.sub,
              last_login_at: new Date().toISOString(),
            },
            { onConflict: "email", ignoreDuplicates: false }
          )
          .select("role")
          .single();

        token.role = (data?.role ?? "member") as UserRole;
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.role = token.role ?? "member";
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
};
