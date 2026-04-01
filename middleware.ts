import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register')

  // Supabase sets a cookie like: sb-<project-ref>-auth-token
  // We check for its presence as a lightweight auth signal.
  // Full session validation happens in server components/layouts.
  const hasAuthCookie = request.cookies.getAll().some(
    (cookie) =>
      cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
  )

  if (!hasAuthCookie && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (hasAuthCookie && isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

