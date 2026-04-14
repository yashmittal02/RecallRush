import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        let user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          // Auto-sign up for this demo application
          const hashedPassword = await bcrypt.hash(credentials.password, 10)
          user = await prisma.user.create({
            data: {
              email: credentials.email,
              password: hashedPassword,
            },
          })
        } else {
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
          if (!isPasswordValid) return null
        }

        return {
          id: user.id,
          email: user.email,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_studysnakes",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    }
  }
}
