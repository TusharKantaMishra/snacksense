import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define routes that don't require authentication
const publicRoutes = ['/', '/signup'];

// Define patterns for resources that should bypass middleware
const bypassPatterns = [
  '/api/',         // All API routes
  '/_next/',       // Next.js resources
  '/favicon.ico',  // Favicon
  '/images/',      // Public images
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for bypassed patterns
  if (bypassPatterns.some(pattern => pathname.startsWith(pattern))) {
    return NextResponse.next();
  }
  
  // Get Firebase token from cookies
  const token = request.cookies.get('firebase-token')?.value;
  const isAuthenticated = !!token && token.length > 20; // Basic validation to ensure token exists and has a reasonable length
  
  // Handle root path - this should always show the signin page for new visitors
  if (pathname === '/') {
    // If authenticated, redirect to home
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    // Otherwise allow access to signin page
    return NextResponse.next();
  }
  
  // Handle signup page
  if (pathname === '/signup') {
    // If authenticated, redirect to home
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/home', request.url));
    }
    // Otherwise allow access to signup
    return NextResponse.next();
  }
  
  // For all other routes, require authentication
  if (!isAuthenticated) {
    // Redirect to login page with error message
    const url = new URL('/', request.url);
    url.searchParams.set('error', 'auth_required');
    url.searchParams.set('message', 'Please sign in to access this page');
    return NextResponse.redirect(url);
  }
  
  // User is authenticated, allow access
  return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except static files
     */
    '/((?!_next/static|_next/image|favicon.ico|images/.*|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
