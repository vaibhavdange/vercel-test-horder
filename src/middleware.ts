import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route mappings: old routes -> new dashboard routes
const routeRedirects = new Map([
  ['/tables', '/dashboard/tables'],
  ['/menu', '/dashboard/menu'],
  ['/staff', '/dashboard/staff'],
  ['/inventory', '/dashboard/inventory'],
  ['/recipes', '/dashboard/recipes'],
  ['/reports', '/dashboard/reports'],
  ['/orders', '/dashboard/orders'],
  ['/settings', '/dashboard/settings'],
  ['/new-order', '/dashboard/new-order'],
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is an old route that needs redirecting
  if (routeRedirects.has(pathname)) {
    const newPath = routeRedirects.get(pathname);
    console.log(`Redirecting ${pathname} to ${newPath}`);
    return NextResponse.redirect(new URL(newPath!, request.url));
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all the old routes that need redirecting
    '/tables',
    '/menu',
    '/staff',
    '/inventory',
    '/recipes',
    '/reports',
    '/orders',
    '/settings',
    '/new-order',
  ],
};
