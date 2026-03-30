import type { GetServerSidePropsContext, NextApiRequest, NextApiResponse } from "next";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import {
  createLoginEvent,
  createEmailUser,
  findUserByEmail,
  findUserById,
  markUserVerified,
  upsertAudienceMember,
  upsertGoogleUser
} from "@/lib/repository";

export const googleAuthReady = Boolean(
  process.env.GOOGLE_AUTH_ENABLED === "true" &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.NEXTAUTH_URL
);

export const authOptions: NextAuthOptions = {
  secret:
    process.env.NEXTAUTH_SECRET ??
    "kairo-fallback-auth-secret-change-this-in-production",
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 30
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    ...(googleAuthReady
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!
          })
        ]
      : []),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();
        let user = await findUserByEmail(normalizedEmail);

        if (!user) {
          const passwordHash = await bcrypt.hash(credentials.password, 10);
          user = await createEmailUser({
            email: normalizedEmail,
            passwordHash,
            marketingOptIn: true,
            productUpdatesOptIn: true
          });
          await markUserVerified(user.email);
        }

        if (!user?.passwordHash) {
          return null;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          premium: user.premium,
          emailVerified: Boolean(user.emailVerifiedAt),
          marketingOptIn: user.marketingOptIn,
          productUpdatesOptIn: user.productUpdatesOptIn
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        const dbUser = await upsertGoogleUser({
          email: user.email,
          name: user.name,
          image: user.image,
          googleId: account.providerAccountId
        });

        await upsertAudienceMember({
          email: dbUser.email,
          userId: dbUser.id,
          marketingOptIn: dbUser.marketingOptIn,
          productUpdatesOptIn: dbUser.productUpdatesOptIn,
          source: "google-auth",
          verifiedAt: dbUser.emailVerifiedAt
        });

        user.id = dbUser.id;
        user.premium = dbUser.premium;
        user.emailVerified = Boolean(dbUser.emailVerifiedAt);
        user.marketingOptIn = dbUser.marketingOptIn;
        user.productUpdatesOptIn = dbUser.productUpdatesOptIn;

        await createLoginEvent({
          userId: dbUser.id,
          email: dbUser.email,
          provider: "google",
          eventType: "sign-in"
        });
      }

      if (account?.provider === "credentials" && user.email && user.id) {
        await upsertAudienceMember({
          email: user.email,
          userId: Number(user.id),
          marketingOptIn: Boolean(user.marketingOptIn),
          productUpdatesOptIn: Boolean(user.productUpdatesOptIn),
          source: "credentials-login",
          verifiedAt: user.emailVerified ? new Date() : null
        });

        await createLoginEvent({
          userId: Number(user.id),
          email: user.email,
          provider: "credentials",
          eventType: "sign-in"
        });
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = Number(user.id);
        token.premium = Boolean(user.premium);
        token.emailVerified = Boolean(user.emailVerified);
        token.marketingOptIn = Boolean(user.marketingOptIn);
        token.productUpdatesOptIn = Boolean(user.productUpdatesOptIn);
      }

      if (token.id) {
        const dbUser = await findUserById(Number(token.id));
        if (dbUser) {
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.premium = dbUser.premium;
          token.emailVerified = Boolean(dbUser.emailVerifiedAt);
          token.marketingOptIn = dbUser.marketingOptIn;
          token.productUpdatesOptIn = dbUser.productUpdatesOptIn;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = Number(token.id);
        session.user.email = String(token.email ?? "");
        session.user.name = token.name ? String(token.name) : null;
        session.user.premium = Boolean(token.premium);
        session.user.emailVerified = Boolean(token.emailVerified);
        session.user.marketingOptIn = Boolean(token.marketingOptIn);
        session.user.productUpdatesOptIn = Boolean(token.productUpdatesOptIn);
      }

      return session;
    }
  }
};

export function getApiSession(req: NextApiRequest, res: NextApiResponse) {
  return getServerSession(req, res, authOptions);
}

export function getPageSession(context: GetServerSidePropsContext) {
  return getServerSession(context.req, context.res, authOptions);
}
