import {
  LayoutDashboard,
  Plus,
  UtensilsCrossed,
  LayoutGrid,
  Users,
  Package,
  ChefHat,
  BarChart3,
  ClipboardList,
  Settings,
} from "lucide-react";

export interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  roles: string[];
  description?: string;
}

export const navigationConfig: NavigationItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["all"], // Allow all authenticated users
    description: "Overview and analytics"
  },
  {
    name: "New Order",
    href: "/dashboard/new-order",
    icon: Plus,
    roles: ["all"], // Allow all authenticated users
    description: "Create new orders"
  },
  {
    name: "Menu",
    href: "/dashboard/menu",
    icon: UtensilsCrossed,
    roles: ["all"], // Allow all authenticated users
    description: "Manage menu items and categories"
  },
  {
    name: "Tables",
    href: "/dashboard/tables",
    icon: LayoutGrid,
    roles: ["all"], // Allow all authenticated users
    description: "Manage restaurant tables and layout"
  },
  {
    name: "Staff",
    href: "/dashboard/staff",
    icon: Users,
    roles: ["all"], // Allow all authenticated users
    description: "Manage staff members"
  },
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
    roles: ["all"], // Allow all authenticated users
    description: "Manage inventory and ingredients"
  },
  {
    name: "Recipes",
    href: "/dashboard/recipes",
    icon: ChefHat,
    roles: ["all"], // Allow all authenticated users
    description: "Manage recipes and preparation"
  },
  {
    name: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3,
    roles: ["all"], // Allow all authenticated users
    description: "View reports and analytics"
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: ClipboardList,
    roles: ["all"], // Allow all authenticated users
    description: "View and manage orders"
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["all"], // Allow all authenticated users
    description: "System settings and configuration"
  },
];

export const getNavigationForRole = (role: string): NavigationItem[] => {
  // For now, return all navigation items regardless of role
  return navigationConfig;
  
  // TODO: Implement role-based filtering later
  // return navigationConfig.filter(item => 
  //   item.roles.includes(role) || item.roles.includes('all')
  // );
};

export const canAccessPage = (path: string, role: string): boolean => {
  // For now, allow all authenticated users to access all pages
  return true;
  
  // TODO: Implement role-based access control later
  // if (path === '/dashboard') {
  //   return role === 'admin' || role === 'manager';
  // }
  
  // const item = navigationConfig.find(nav => nav.href === path);
  // if (!item) return false;
  // return item.roles.includes(role) || item.roles.includes('all');
};
