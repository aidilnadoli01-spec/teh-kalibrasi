import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { query } from "./db";
import bcrypt from "bcryptjs";

// ====================================================
// USER Auth Options — hanya izinkan role 'customer'
// Token disimpan via NextAuth session cookie default
// ====================================================
export const userAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "user-credentials",
      name: "User Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const users: any = await query(
          "SELECT * FROM users WHERE email = ?",
          [credentials.email]
        );

        if (!users || users.length === 0) {
          throw new Error("Invalid email or password");
        }

        const user = users[0];

        // ✅ Validasi role: HANYA boleh customer
        if (user.role !== "customer") {
          throw new Error("Access denied: admin accounts must use the admin login portal");
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: "customer",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-for-development",
};

// ====================================================
// ADMIN Auth Options — hanya izinkan role 'admin'
// Gunakan cookie prefix berbeda agar tidak bentrok
// ====================================================
export const adminAuthOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const users: any = await query(
          "SELECT * FROM users WHERE email = ?",
          [credentials.email]
        );

        if (!users || users.length === 0) {
          throw new Error("Invalid email or password");
        }

        const user = users[0];

        // ✅ Validasi role: HANYA boleh admin
        if (user.role !== "admin") {
          throw new Error("Access denied: this account does not have admin privileges");
        }

        const isPasswordMatch = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordMatch) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: "admin",
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin",
  },
  // ✅ Cookie prefix berbeda agar session admin & user tidak saling menimpa
  cookies: {
    sessionToken: {
      name: `admin-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "super-secret-key-for-development",
};

// Backward-compat alias (digunakan oleh [...nextauth] user route)
export const authOptions = userAuthOptions;
