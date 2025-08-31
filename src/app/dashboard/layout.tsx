"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "@/components/shared/sidebar";
import RouteGuard from "@/components/shared/RouteGuard";
import Header from "@/components/shared/header";
import { useRealtimeUpdates } from "@/hooks";
import HotRoutesWarmup from "@/components/shared/HotRoutesWarmup";
import { useSession } from "@/lib/auth-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, loading: isLoading, isAuthenticated } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Enable comprehensive real-time updates for the entire dashboard
  useRealtimeUpdates();

  // Remove localStorage-based auth check
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const titleMap: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/dashboard/menu": "Menu Management",
    "/dashboard/inventory": "Inventory",
    "/dashboard/orders": "Orders",
    "/dashboard/new-order": "New Order",
    "/dashboard/tables": "Tables",
    "/dashboard/staff": "Staff",
    "/dashboard/recipes": "Recipes",
    "/dashboard/reports": "Reports",
    "/dashboard/settings": "Settings",
    "/dashboard/customers": "Customers",
    "/dashboard/transactions": "Transactions",
    "/dashboard/analytics": "Analytics",
  };

  const deriveTitleFromPath = (path: string) => {
    const segment = path.split("/").filter(Boolean).pop() || "dashboard";
    return segment
      .split("-")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  };

  const matched = Object.entries(titleMap)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([route]) => pathname.startsWith(route));
  const headerTitle = matched ? matched[1] : deriveTitleFromPath(pathname);

  return (
    <RouteGuard>
      <HotRoutesWarmup />
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Header title={headerTitle} />
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </RouteGuard>
  );
}
