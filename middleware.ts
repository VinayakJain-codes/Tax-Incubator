import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  return NextResponse.next()
}

// Disabled: middleware was causing MIDDLEWARE_INVOCATION_FAILED on Vercel.
// Auth is handled in server layouts instead.
export const config = {
  matcher: [],
}

