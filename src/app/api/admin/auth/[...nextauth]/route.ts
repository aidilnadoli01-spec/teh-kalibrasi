import NextAuth from "next-auth";
import { adminAuthOptions } from "@/lib/auth";

// Route ini KHUSUS untuk admin
// Menggunakan adminAuthOptions dengan cookie prefix berbeda
const handler = NextAuth(adminAuthOptions);

export { handler as GET, handler as POST };
