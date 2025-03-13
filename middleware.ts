import { authMiddleware, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Create an array of public routes that don't require authentication
const publicRoutes = [
  "/",
  "/api/demo/generate-logo",
  "/sign-in(.*)",
  "/sign-up(.*)"
];

export default authMiddleware({
  publicRoutes,
  async afterAuth(auth, req: NextRequest) {
    console.log('Request path:', req.nextUrl.pathname);
    console.log('Full auth object:', JSON.stringify({
      userId: auth.userId,
      sessionClaims: auth.sessionClaims,
      sessionId: auth.sessionId
    }, null, 2));

    // Add CORS headers for API routes
    if (req.nextUrl.pathname.startsWith('/api/')) {
      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 204 });
        response.headers.set('Access-Control-Allow-Origin', '*');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400');
        return response;
      }

      // Add CORS headers to actual requests
      const response = NextResponse.next();
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      return response;
    }

    // Handle public routes
    if (publicRoutes.some(pattern => new RegExp(`^${pattern}$`).test(req.nextUrl.pathname))) {
      return NextResponse.next();
    }

    // Check if user is authenticated
    if (!auth.userId) {
      console.log('No session found, redirecting to sign-in');
      return NextResponse.redirect(new URL('/sign-in', req.url));
    }

    // Admin route check
    if (req.nextUrl.pathname.startsWith('/admin')) {
      console.log('Checking admin access...');
      
      // Direct check from Clerk API instead of JWT claims
      let isAdmin = false;
      
      try {
        // Get user data directly from Clerk API
        const user = await clerkClient.users.getUser(auth.userId);
        console.log('User public metadata:', user.publicMetadata);
        
        // Check for admin role in different formats
        const roleAsString = user.publicMetadata.role;
        const roleAsArray = user.publicMetadata.roles as string[] | undefined;
        
        isAdmin = 
          roleAsString === 'admin' || 
          (Array.isArray(roleAsArray) && roleAsArray.includes('admin'));
          
        console.log('Direct API admin check:', {
          roleAsString,
          roleAsArray,
          isAdmin
        });
      } catch (error) {
        console.error('Error checking admin status:', error);
      }

      if (!isAdmin) {
        console.log('Not admin, redirecting to home');
        return NextResponse.redirect(new URL('/', req.url));
      }
      console.log('Admin access granted');
      return NextResponse.next();
    }

    // Homepage redirect
    if (req.nextUrl.pathname === '/') {
      let isAdmin = false;
      
      try {
        // Get user data directly from Clerk API
        const user = await clerkClient.users.getUser(auth.userId);
        
        // Check for admin role in different formats
        const roleAsString = user.publicMetadata.role;
        const roleAsArray = user.publicMetadata.roles as string[] | undefined;
        
        isAdmin = 
          roleAsString === 'admin' || 
          (Array.isArray(roleAsArray) && roleAsArray.includes('admin'));
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
      
      if (isAdmin) {
        console.log('Admin user on homepage, redirecting to admin');
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      console.log('Regular user on homepage, redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
});

// Configure Middleware Matcher
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
