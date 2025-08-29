"use client";

import { useState, useEffect } from "react";
import { User, LogOut, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { useSettings } from "@/hooks/useSettings";

// Digital Clock Component
function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="text-lg font-medium text-green-600">
      {formatTime(time)}
    </div>
  );
}

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const { settings, refreshSettings } = useSettings();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = () => {
      refreshSettings();
    };

    window.addEventListener('settings:updated', handleSettingsUpdate);
    return () => window.removeEventListener('settings:updated', handleSettingsUpdate);
  }, [refreshSettings]);

  // Get restaurant name from settings, fallback to 'HORDER' if not set
  const restaurantName = settings?.restaurantName || 'HORDER';

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-4 py-4 h-16">
        <div className="flex items-center justify-between h-full">
          {/* Left side */}
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-md"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Center - Digital Clock */}
          <div className="flex-1 flex justify-center">
            <DigitalClock />
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* User menu */}
            <div className="relative">
              <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-md">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {session?.user?.email || "User"}
                </span>
              </button>
            </div>
           
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-gray-100 rounded-md text-gray-600"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="bg-white w-64 h-full p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Menu</h2>
                  <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-md"
                  >
                <X className="w-5 h-5" />
                  </button>
                </div>
            <nav className="space-y-2">
              <button
                onClick={() => {
                  router.push("/dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-md"
              >
                Dashboard
              </button>
              <button
                onClick={() => {
                  router.push("/dashboard/new-order");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-md"
              >
                New Order
              </button>
              <button
                onClick={() => {
                  router.push("/dashboard/orders");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-md"
              >
                Orders
                            </button>
              <button
                onClick={() => {
                  router.push("/dashboard/tables");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-md"
              >
                Tables
                    </button>
              <button
                onClick={() => {
                  router.push("/dashboard/menu");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-md"
              >
                Menu
              </button>
                  <button
                onClick={() => {
                  router.push("/dashboard/settings");
                  setIsMobileMenuOpen(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-100 rounded-md"
              >
                Settings
                  </button>
            </nav>
            </div>
        </div>
      )}
    </>
  );
}
