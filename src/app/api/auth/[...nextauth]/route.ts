import NextAuth from "next-auth";
import { userAuthOptions } from "@/lib/auth";

// Route ini HANYA untuk user/customer
// Admin menggunakan endpoint /api/admin/auth/[...nextauth]
const handler = NextAuth(userAuthOptions);

export { handler as GET, handler as POST };
