import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';
  
  // Check if this is a subdomain request (not localhost or main domain)
  const isSubdomain = hostname.includes('.') && 
                     !hostname.includes('localhost') && 
                     !hostname.includes('127.0.0.1') &&
                     !hostname.includes(process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'horder.com');
  
  if (isSubdomain) {
    try {
      const subdomain = hostname.split('.')[0];
      
      // Skip if it's www or api subdomain
      if (subdomain === 'www' || subdomain === 'api') {
        return NextResponse.next();
      }
      
      // Get tenant by subdomain
      const supabase = createServerSupabaseClient();
      const { data: tenant, error } = await supabase
        .from('tenants')
        .select('id, name, subdomain, is_active, settings')
        .eq('subdomain', subdomain)
        .eq('is_active', true)
        .single();

      if (error || !tenant) {
        // Redirect to main domain with error
        const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'horder.com';
        const redirectUrl = new URL(`/?error=tenant-not-found&subdomain=${subdomain}`, `https://${mainDomain}`);
        return NextResponse.redirect(redirectUrl);
      }

      // Add tenant info to headers for API routes and components
      const response = NextResponse.next();
      response.headers.set('x-tenant-id', tenant.id);
      response.headers.set('x-tenant-subdomain', tenant.subdomain);
      response.headers.set('x-tenant-name', tenant.name);
      response.headers.set('x-tenant-settings', JSON.stringify(tenant.settings || {}));
      
      return response;
    } catch (error) {
      console.error('Subdomain middleware error:', error);
      const mainDomain = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'horder.com';
      const redirectUrl = new URL(`/?error=subdomain-error`, `https://${mainDomain}`);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
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
    // Match all requests except static files and API routes
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
