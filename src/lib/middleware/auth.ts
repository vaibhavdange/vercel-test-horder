import { NextRequest, NextResponse } from "next/server";

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

export function requireAuth(request: NextRequest): NextResponse | null {
  // In production, this would check JWT tokens, session cookies, etc.
  // For now, we'll implement a basic check that can be enhanced later
  
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  const token = authHeader.substring(7);
  
  // Basic token validation (replace with proper JWT validation in production)
  if (token === 'demo-token' || process.env.NODE_ENV === 'development') {
    // Mock user for development
    (request as AuthenticatedRequest).user = {
      id: '1',
      username: 'admin',
      role: 'admin',
      permissions: ['orders', 'products', 'customers', 'settings']
    };
    return null; // Continue to next middleware
  }
  
  return NextResponse.json(
    { error: 'Invalid token' },
    { status: 401 }
  );
}

export function requirePermission(permission: string) {
  return (request: AuthenticatedRequest): NextResponse | null => {
    if (!request.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    if (!request.user.permissions.includes(permission)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    return null; // Continue to next middleware
  };
}
