"use client";

import { useRouter } from "next/navigation";
import { Shield, ArrowLeft, Home, LogOut } from "lucide-react";
import { Button } from "../ui/button";

interface AccessDeniedProps {
  requiredRole?: string;
  currentRole?: string;
  pageName?: string;
}

export default function AccessDenied({ 
  requiredRole = "admin", 
  currentRole = "cashier",
  pageName = "this page"
}: AccessDeniedProps) {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  const handleGoHome = () => {
    // Get user role to determine where to redirect
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'cashier') {
          router.push('/new-order');
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        router.push('/dashboard');
      }
    } else {
      router.push('/dashboard');
    }
  };

  const handleLogout = () => {
    // Clear any stored authentication data
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    // Redirect to login page
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-strong p-8 text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Shield className="w-8 h-8 text-red-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Access Denied
        </h1>

        {/* Message */}
        <p className="text-gray-600 mb-6">
          You don't have permission to access {pageName}. 
          This page requires <span className="font-semibold text-red-600">{requiredRole}</span> role, 
          but you are logged in as <span className="font-semibold text-gray-800">{currentRole}</span>.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleGoBack}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          
          <Button
            onClick={handleGoHome}
            className="w-full"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Dashboard
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Help Text */}
        <p className="text-sm text-gray-500 mt-6">
          If you believe this is an error, please contact your administrator.
        </p>
      </div>
    </div>
  );
}
