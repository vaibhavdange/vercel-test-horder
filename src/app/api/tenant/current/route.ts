import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const tenantId = headersList.get('x-tenant-id');
    const tenantName = headersList.get('x-tenant-name');
    const tenantSubdomain = headersList.get('x-tenant-subdomain');
    const tenantSettings = headersList.get('x-tenant-settings');

    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context found' }, { status: 404 });
    }

    const tenant = {
      id: tenantId,
      name: tenantName,
      subdomain: tenantSubdomain,
      settings: tenantSettings ? JSON.parse(tenantSettings) : {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Error getting current tenant:', error);
    return NextResponse.json(
      { error: 'Failed to get tenant context' },
      { status: 500 }
    );
  }
}
