# Multi-Tenant Subdomain Architecture

## Overview

This document describes the complete multi-tenant subdomain implementation for the POS system. Each restaurant gets their own subdomain (e.g., `mystore.horder.com`) with complete data isolation.

## Architecture Flow

### 1. **Signup Process**
```
User signs up → Supabase auth.users table populated → 
Backend API creates tenant → Redirects to subdomain
```

### 2. **Subdomain Access**
```
mystore.horder.com → Middleware extracts subdomain → 
Looks up tenant → Sets tenant context → Renders tenant-specific UI
```

### 3. **Data Isolation**
```
Every database record → Auto-tagged with tenant_id → 
RLS policies enforce isolation → Users only see their data
```

## Implementation Details

### **Middleware (`src/middleware.ts`)**

Handles subdomain routing and tenant context:

```typescript
// Detects subdomain requests
const isSubdomain = hostname.includes('.') && 
                   !hostname.includes('localhost') && 
                   !hostname.includes(process.env.NEXT_PUBLIC_MAIN_DOMAIN);

// Looks up tenant by subdomain
const { data: tenant } = await supabase
  .from('tenants')
  .select('id, name, subdomain, is_active, settings')
  .eq('subdomain', subdomain)
  .single();

// Sets tenant context in headers
response.headers.set('x-tenant-id', tenant.id);
response.headers.set('x-tenant-subdomain', tenant.subdomain);
response.headers.set('x-tenant-name', tenant.name);
```

### **Database Schema**

#### **Tenants Table**
```sql
CREATE TABLE public.tenants (
  id text PRIMARY KEY,                    -- UUID
  name text NOT NULL,                     -- Business name
  subdomain text UNIQUE,                  -- mystore.horder.com
  owner_id text REFERENCES users(id),     -- User who owns this tenant
  settings jsonb DEFAULT '{}',            -- Tenant-specific settings
  is_active boolean DEFAULT true,         -- Active status
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);
```

#### **Tenant ID on All Tables**
Every business table has a `tenant_id` column:
- `products.tenant_id`
- `orders.tenant_id`
- `customers.tenant_id`
- `tables.tenant_id`
- etc.

### **Automatic Tenant ID Setting**

Database triggers automatically set `tenant_id` on insert:

```sql
-- Function to get current user's tenant
CREATE FUNCTION get_current_tenant_id() RETURNS text AS $$
  SELECT t.id FROM tenants t WHERE t.owner_id = auth.uid() AND t.is_active = true;
$$ LANGUAGE plpgsql;

-- Trigger to auto-set tenant_id
CREATE TRIGGER set_products_tenant_id
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION set_tenant_id();
```

### **Row Level Security (RLS)**

Every table has RLS policies for tenant isolation:

```sql
-- Example: Products table
CREATE POLICY "Tenant isolation for products" ON products
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = get_current_tenant_id()
  );
```

### **Subdomain Routing**

#### **URL Structure**
- Main domain: `horder.com` (signup, login, marketing)
- Tenant subdomains: `{subdomain}.horder.com` (restaurant dashboard)

#### **Route Handling**
- `mystore.horder.com` → `/tenant/mystore/page.tsx`
- `mystore.horder.com/orders` → `/tenant/mystore/orders/page.tsx`
- `mystore.horder.com/menu` → `/tenant/mystore/menu/page.tsx`

### **Tenant Context Provider**

```typescript
// Provides tenant context throughout the app
<TenantProvider tenant={tenant}>
  <Dashboard />
</TenantProvider>

// Hook to access tenant context
const { tenant, loading, error } = useTenant();
```

## File Structure

```
src/
├── middleware.ts                          # Subdomain routing
├── app/
│   ├── page.tsx                          # Main domain (login/signup)
│   ├── signup/page.tsx                   # Comprehensive signup
│   └── tenant/
│       └── [subdomain]/
│           ├── layout.tsx                # Tenant-specific layout
│           ├── page.tsx                  # Tenant dashboard
│           ├── orders/page.tsx           # Tenant orders
│           ├── menu/page.tsx             # Tenant menu
│           └── settings/page.tsx         # Tenant settings
├── components/
│   └── providers/
│       └── TenantProvider.tsx            # Tenant context
├── lib/
│   └── database/
│       └── supabase-multi-tenant.ts      # Multi-tenant DB operations
└── app/api/
    ├── tenants/route.ts                  # Tenant creation
    └── tenant/current/route.ts           # Get current tenant
```

## Environment Variables

```bash
# Main domain configuration
NEXT_PUBLIC_MAIN_DOMAIN=horder.com
NEXT_PUBLIC_APP_URL=https://horder.com

# Google Maps API (for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here

# Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE=your_service_role_key
```

## DNS Configuration

### **Production Setup**
```bash
# Add these DNS records to your domain provider
*.horder.com    A    YOUR_SERVER_IP
horder.com      A    YOUR_SERVER_IP
www.horder.com  A    YOUR_SERVER_IP
```

### **Local Development**
Add to `/etc/hosts`:
```
127.0.0.1 localhost
127.0.0.1 mystore.localhost
127.0.0.1 cafe-downtown.localhost
127.0.0.1 pizzapalace.localhost
```

## User Journey

### **1. Restaurant Owner Signs Up**
1. Visits `horder.com/signup`
2. Fills out comprehensive form (business info, address, etc.)
3. System creates user account in Supabase
4. System creates tenant record with generated subdomain
5. Redirects to `{subdomain}.horder.com`

### **2. Restaurant Owner Accesses Their Dashboard**
1. Visits `mystore.horder.com`
2. Middleware detects subdomain and looks up tenant
3. Sets tenant context in headers
4. Renders tenant-specific dashboard
5. All data queries are automatically filtered by tenant_id

### **3. Staff Members**
1. Restaurant owner invites staff
2. Staff members get access to the same subdomain
3. All data remains isolated to that tenant

## Security Features

### **Data Isolation**
- Every database record tagged with `tenant_id`
- RLS policies prevent cross-tenant data access
- Automatic tenant context from JWT tokens

### **Subdomain Validation**
- Middleware validates subdomain exists
- Redirects invalid subdomains to main domain
- Error handling for non-existent tenants

### **Access Control**
- Only tenant owners can modify tenant settings
- Staff members inherit tenant context
- API routes validate tenant access

## API Endpoints

### **Tenant Management**
- `POST /api/tenants` - Create new tenant
- `GET /api/tenants` - Get user's tenant
- `GET /api/tenant/current` - Get current tenant from headers

### **Multi-Tenant Database Operations**
All database operations automatically include tenant filtering:
- `multiTenantDb.getProducts()` - Only returns products for current tenant
- `multiTenantDb.createOrder()` - Automatically tags with tenant_id
- `multiTenantDb.getOrders()` - Only returns orders for current tenant

## Error Handling

### **Subdomain Errors**
- `tenant-not-found` - Subdomain doesn't exist
- `subdomain-error` - General subdomain access error
- Automatic redirect to main domain with error message

### **Database Errors**
- Tenant context missing - Redirect to login
- RLS policy violations - Access denied
- Invalid tenant_id - Data not found

## Performance Considerations

### **Database Indexes**
- All `tenant_id` columns are indexed
- Subdomain lookups are optimized
- RLS policies use efficient queries

### **Caching**
- Tenant context cached in headers
- Subdomain lookups cached in middleware
- Database queries optimized for tenant filtering

## Monitoring & Analytics

### **Tenant Metrics**
- Track tenant creation and usage
- Monitor subdomain access patterns
- Database performance per tenant

### **Error Tracking**
- Subdomain resolution errors
- Tenant context failures
- RLS policy violations

## Future Enhancements

### **Custom Domains**
- Allow tenants to use their own domains
- CNAME record configuration
- SSL certificate management

### **Multi-Location Support**
- Multiple subdomains per tenant
- Location-specific settings
- Cross-location reporting

### **Advanced Features**
- Tenant-specific themes
- Custom branding
- White-label solutions

## Troubleshooting

### **Common Issues**

1. **Subdomain Not Working**
   - Check DNS configuration
   - Verify middleware is running
   - Check tenant exists in database

2. **Data Not Showing**
   - Verify RLS policies are enabled
   - Check tenant_id is set correctly
   - Verify user has tenant access

3. **Signup Redirect Issues**
   - Check tenant creation API
   - Verify subdomain generation
   - Check redirect URL format

### **Debug Tools**
- Check middleware logs for subdomain resolution
- Verify tenant context in browser dev tools
- Test RLS policies with direct database queries

## Migration Guide

### **From Single-Tenant to Multi-Tenant**

1. **Run Database Migration**
   ```bash
   # Apply the multi-tenancy migration
   supabase db push
   ```

2. **Update Environment Variables**
   ```bash
   NEXT_PUBLIC_MAIN_DOMAIN=yourdomain.com
   ```

3. **Configure DNS**
   - Add wildcard subdomain record
   - Test subdomain resolution

4. **Test Tenant Creation**
   - Create test tenant
   - Verify subdomain access
   - Test data isolation

This multi-tenant subdomain architecture provides complete data isolation while maintaining a seamless user experience for each restaurant.
