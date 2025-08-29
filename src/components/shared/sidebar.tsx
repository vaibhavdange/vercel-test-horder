"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useSettings } from "@/hooks/useSettings";
import {
  MdDashboard,
  MdAddShoppingCart,
  MdPeople,
  MdInventory2,
  MdInsights,
  MdSettings,
  MdEditNote,
  MdTableRestaurant,
  MdMenuBook,
  MdSoupKitchen,
  MdChevronLeft,
  MdChevronRight
} from "react-icons/md";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: MdDashboard },
  { name: "New Order", href: "/dashboard/new-order", icon: MdAddShoppingCart },
  { name: "Orders", href: "/dashboard/orders", icon: MdEditNote },
  { name: "Tables", href: "/dashboard/tables", icon: MdTableRestaurant },
  { name: "Menu", href: "/dashboard/menu", icon: MdMenuBook },
  { name: "Inventory", href: "/dashboard/inventory", icon: MdInventory2 },
  { name: "Staff", href: "/dashboard/staff", icon: MdPeople },
  { name: "Recipes", href: "/dashboard/recipes", icon: MdSoupKitchen },
  { name: "Reports", href: "/dashboard/reports", icon: MdInsights },
  { name: "Settings", href: "/dashboard/settings", icon: MdSettings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { settings, refreshSettings } = useSettings();
  
  // Initialize state from localStorage with collapsed as default
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      // Default to collapsed (true) if no preference is saved
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true; // Default to collapsed
  });

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    }
  };

  // Handle hydration to prevent mismatch between server and client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar-collapsed');
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    }
  }, []);

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      refreshSettings();
    };

    window.addEventListener('settings:updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings:updated', handleSettingsUpdate);
  }, [refreshSettings]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + B to toggle sidebar
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]); // Include isCollapsed in dependencies

  // When idle, prefetch most-used dashboard routes to speed up first navigation
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const idleCb = () => {
      try {
        [
          '/dashboard/new-order',
          '/dashboard/orders',
          '/dashboard/tables',
          '/dashboard/menu',
          '/dashboard/inventory',
        ].forEach((path) => router.prefetch(path));
      } catch {}
    };
    if ('requestIdleCallback' in window) {
      // @ts-ignore
      const id = window.requestIdleCallback(idleCb);
      return () => {
        try { /* @ts-ignore */ window.cancelIdleCallback && window.cancelIdleCallback(id); } catch {}
      };
    } else {
      const id = (window as any).setTimeout(idleCb, 500);
      return () => (window as any).clearTimeout(id);
    }
  }, [router]);

  // Get restaurant name from settings, fallback to 'HORDER' if not set
  const restaurantName = settings?.restaurantName || 'HORDER';
  const firstLetter = restaurantName.charAt(0).toUpperCase();

  return (
    <div className={`flex h-full flex-col bg-white border-r border-gray-200 shadow-lg transition-all duration-300 ease-in-out z-10 ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${isCollapsed ? 'border-r-2 border-gray-300' : ''}`}>
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200 relative">
        {!isCollapsed && <h1 className="text-2xl font-bold text-gray-900">{restaurantName}</h1>}
        {isCollapsed && <h1 className="text-lg font-bold text-gray-900">{firstLetter}</h1>}
        
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 hover:scale-110"
          title={isCollapsed ? "Expand sidebar (Ctrl/Cmd + B)" : "Collapse sidebar (Ctrl/Cmd + B)"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <MdChevronRight className="h-4 w-4 text-gray-600" />
          ) : (
            <MdChevronLeft className="h-4 w-4 text-gray-600" />
          )}
        </button>
        
        {/* Collapsed State Hint */}
        {isCollapsed && (
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
            <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center justify-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-green-100 text-green-700 border border-green-200 shadow-sm"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              } ${isCollapsed ? 'justify-center hover:bg-gray-100' : 'justify-start'}`}
              title={isCollapsed ? item.name : undefined}
              onMouseEnter={() => router.prefetch(item.href)}
            >
              <item.icon
                className={`flex-shrink-0 transition-colors duration-200 ${
                  isActive ? "text-green-600" : "text-gray-400 group-hover:text-gray-500"
                } ${isCollapsed ? 'h-5 w-5' : 'mr-3 h-5 w-5'}`}
              />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>


    </div>
  );
}
