import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import { compare } from "bcryptjs"

export type UserRole =
  | "CLIENT"
  | "AGENT"
  | "AGENCY_STAFF"
  | "SUPER_AGENT"
  | "PARTNER_ADMIN"
  | "ADMINISTRATOR"
  | "ACCOUNTANT"
  | "SUPERVISOR"
  | "LOGISTICS"
  | "TRAVELIA_ADMIN"
  | "TECH_ADMIN"
  | "OPERATIONS_MANAGER"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const rawEmail = credentials.email.trim()
        const normalizedEmail = rawEmail.toLowerCase()

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: rawEmail },
                { email: normalizedEmail },
              ],
            },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              password: true,
              isActive: true,
            },
          })

          if (!user || !user.isActive) {
            return null
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role as UserRole,
          }
        } catch (e) {
          console.error('[auth] authorize / base de données:', e)
          const msg = e instanceof Error ? e.message : String(e)
          if (/NODE_MODULE_VERSION|ERR_DLOPEN|better_sqlite3|better-sqlite3/i.test(msg)) {
            throw new Error('SQLITE_NATIVE_MISMATCH')
          }
          throw new Error('AUTH_DATABASE')
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role as UserRole
        token.id = user.id
        token.name = user.name
        token.email = user.email
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as UserRole
        session.user.id = token.id as string
        if (typeof token.name === "string") session.user.name = token.name
        if (typeof token.email === "string") session.user.email = token.email
      }
      return session
    }
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret:
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev-only-nextauth-secret-change-in-env-local"
      : undefined),
}
