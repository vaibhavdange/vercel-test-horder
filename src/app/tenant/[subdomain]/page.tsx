import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  ChefHat,
  Receipt,
  Clock
} from 'lucide-react';

interface TenantDashboardProps {
  params: { subdomain: string };
}

export default async function TenantDashboard({ params }: TenantDashboardProps) {
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantName = headersList.get('x-tenant-name');
  
  if (!tenantId) {
    redirect('/?error=tenant-not-found');
  }

  const dashboardItems = [
    {
      title: 'New Order',
      description: 'Create a new order',
      href: `/tenant/${params.subdomain}/new-order`,
      icon: ShoppingCart,
      color: 'bg-green-500',
    },
    {
      title: 'Orders',
      description: 'View and manage orders',
      href: `/tenant/${params.subdomain}/orders`,
      icon: Receipt,
      color: 'bg-blue-500',
    },
    {
      title: 'Menu',
      description: 'Manage your menu items',
      href: `/tenant/${params.subdomain}/menu`,
      icon: ChefHat,
      color: 'bg-purple-500',
    },
    {
      title: 'Tables',
      description: 'Manage table layout',
      href: `/tenant/${params.subdomain}/tables`,
      icon: Clock,
      color: 'bg-orange-500',
    },
    {
      title: 'Staff',
      description: 'Manage staff members',
      href: `/tenant/${params.subdomain}/staff`,
      icon: Users,
      color: 'bg-indigo-500',
    },
    {
      title: 'Inventory',
      description: 'Track inventory levels',
      href: `/tenant/${params.subdomain}/inventory`,
      icon: Package,
      color: 'bg-yellow-500',
    },
    {
      title: 'Reports',
      description: 'View sales and analytics',
      href: `/tenant/${params.subdomain}/reports`,
      icon: BarChart3,
      color: 'bg-pink-500',
    },
    {
      title: 'Settings',
      description: 'Configure your restaurant',
      href: `/tenant/${params.subdomain}/settings`,
      icon: Settings,
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {tenantName}
          </h1>
          <p className="text-gray-600">
            Manage your restaurant operations from your personalized dashboard
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Receipt className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                  <p className="text-2xl font-bold text-gray-900">₹0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChefHat className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Menu Items</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Tables</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardItems.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${item.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {item.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href={item.href}>
                    <Button className="w-full" variant="outline">
                      Open
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Getting Started */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Set up your restaurant POS system in a few easy steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">1</span>
                </div>
                <div>
                  <p className="font-medium">Add your menu items</p>
                  <p className="text-sm text-gray-600">Start by adding your restaurant's menu items and categories</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium">Set up your tables</p>
                  <p className="text-sm text-gray-600">Configure your table layout for dine-in orders</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">3</span>
                </div>
                <div>
                  <p className="font-medium">Add staff members</p>
                  <p className="text-sm text-gray-600">Invite your team members to help manage orders</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">4</span>
                </div>
                <div>
                  <p className="font-medium">Configure settings</p>
                  <p className="text-sm text-gray-600">Set up payment methods, tax rates, and other preferences</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
