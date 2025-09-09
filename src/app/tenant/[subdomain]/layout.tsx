import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { TenantProvider } from '@/components/providers/TenantProvider';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: { subdomain: string };
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantName = headersList.get('x-tenant-name');
  const tenantSubdomain = headersList.get('x-tenant-subdomain');
  const tenantSettings = headersList.get('x-tenant-settings');
  
  if (!tenantId) {
    redirect('/?error=tenant-not-found');
  }

  const tenant = {
    id: tenantId,
    name: tenantName || '',
    subdomain: tenantSubdomain || params.subdomain,
    settings: tenantSettings ? JSON.parse(tenantSettings) : {},
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <TenantProvider tenant={tenant}>
      <div className="tenant-layout min-h-screen bg-gray-50">
        {/* Tenant Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{tenant.name}</h1>
              <p className="text-sm text-gray-500">
                Welcome to {tenant.name}'s POS System
              </p>
            </div>
            <div className="text-sm text-gray-500">
              {tenant.subdomain}.horder.com
            </div>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </TenantProvider>
  );
}
