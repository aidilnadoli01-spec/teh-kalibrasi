import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || 'super-secret-key-for-development';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ====================================================
  // ADMIN ROUTE PROTECTION: /admin/*
  // Cek admin token (menggunakan cookie name 'admin-next-auth.session-token')
  // ====================================================
  if (pathname.startsWith('/admin') && !pathname.startsWith('/api/admin/auth')) {
    const adminToken = await getToken({
      req: request,
      secret: NEXTAUTH_SECRET,
      cookieName: 'admin-next-auth.session-token',
    });

    // Tidak ada admin token → arahkan ke halaman login admin
    if (!adminToken) {
      // Jika sudah di /admin (halaman login admin itu sendiri), biarkan tampil
      if (pathname === '/admin') {
        return NextResponse.next();
      }
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Token ada tapi bukan admin → tolak
    if (adminToken.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    return NextResponse.next();
  }

  // ====================================================
  // USER ROUTE PROTECTION: /profile, /wishlist, /store
  // Cek user token (cookie default NextAuth)
  // ====================================================
  const protectedUserRoutes = ['/profile', '/wishlist'];
  const isProtectedUserRoute = protectedUserRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedUserRoute) {
    const userToken = await getToken({
      req: request,
      secret: NEXTAUTH_SECRET,
      // Cookie default NextAuth (tidak ada nama khusus)
    });

    if (!userToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Jika admin mencoba akses halaman user → arahkan ke admin dashboard
    if (userToken.role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/profile/:path*',
    '/wishlist/:path*',
  ],
};
