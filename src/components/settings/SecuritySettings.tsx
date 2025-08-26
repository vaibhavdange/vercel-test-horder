"use client";

import { useState } from "react";
import { Shield, User, Lock, Save, AlertTriangle } from "lucide-react";

interface SecuritySettingsConfig {
  requirePasswordChange: boolean;
  passwordExpiryDays: number;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  twoFactorEnabled: boolean;
  auditLogging: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  isEnabled: boolean;
  category: "orders" | "inventory" | "reports" | "settings" | "staff";
}

interface SecuritySettingsProps {
  className?: string;
}

export default function SecuritySettings({ className = '' }: SecuritySettingsProps) {
  const [securitySettings, setSecuritySettings] = useState<SecuritySettingsConfig>({
    requirePasswordChange: true,
    passwordExpiryDays: 90,
    maxLoginAttempts: 5,
    sessionTimeoutMinutes: 30,
    twoFactorEnabled: false,
    auditLogging: true
  });

  const [permissions] = useState<Permission[]>([
    {
      id: "1",
      name: "Create Orders",
      description: "Allow creating new orders",
      isEnabled: true,
      category: "orders"
    },
    {
      id: "2",
      name: "Edit Orders",
      description: "Allow modifying existing orders",
      isEnabled: true,
      category: "orders"
    },
    {
      id: "3",
      name: "Delete Orders",
      description: "Allow deleting orders",
      isEnabled: false,
      category: "orders"
    },
    {
      id: "4",
      name: "View Inventory",
      description: "Allow viewing inventory levels",
      isEnabled: true,
      category: "inventory"
    },
    {
      id: "5",
      name: "Modify Inventory",
      description: "Allow changing inventory quantities",
      isEnabled: true,
      category: "inventory"
    },
    {
      id: "6",
      name: "View Reports",
      description: "Allow accessing reports and analytics",
      isEnabled: true,
      category: "reports"
    },
    {
      id: "7",
      name: "System Settings",
      description: "Allow changing system configuration",
      isEnabled: false,
      category: "settings"
    },
    {
      id: "8",
      name: "Manage Staff",
      description: "Allow adding/removing staff members",
      isEnabled: false,
      category: "staff"
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSaving(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getCategoryIcon = (category: Permission["category"]) => {
    switch (category) {
      case "orders": return "📋";
      case "inventory": return "📦";
      case "reports": return "📊";
      case "settings": return "⚙️";
      case "staff": return "👥";
      default: return "🔒";
    }
  };

  const getCategoryLabel = (category: Permission["category"]) => {
    switch (category) {
      case "orders": return "Orders";
      case "inventory": return "Inventory";
      case "reports": return "Reports";
      case "settings": return "Settings";
      case "staff": return "Staff";
      default: return "Other";
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 text-green-800">
            <Shield className="h-5 w-5" />
            <span className="font-medium">Security settings saved successfully!</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Settings */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-blue-600" />
              Password Security
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={securitySettings.requirePasswordChange}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, requirePasswordChange: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Require password change</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password expiry (days)
                </label>
                <input
                  type="number"
                  min="30"
                  max="365"
                  value={securitySettings.passwordExpiryDays}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, passwordExpiryDays: parseInt(e.target.value) || 90 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max login attempts
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, maxLoginAttempts: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-600" />
              Session & Access Control
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Session timeout (minutes)
                </label>
                <input
                  type="number"
                  min="15"
                  max="480"
                  value={securitySettings.sessionTimeoutMinutes}
                  onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeoutMinutes: parseInt(e.target.value) || 30 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={securitySettings.twoFactorEnabled}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, twoFactorEnabled: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable two-factor authentication</span>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={securitySettings.auditLogging}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, auditLogging: e.target.checked })}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Enable audit logging</span>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{isSaving ? "Saving..." : "Save Settings"}</span>
            </button>
          </div>
        </div>

        {/* Permissions */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-purple-600" />
              User Permissions
            </h2>
            
            <div className="space-y-4">
              {permissions.map((permission) => (
                <div key={permission.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">{getCategoryIcon(permission.category)}</div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{permission.name}</h4>
                      <p className="text-xs text-gray-500">{permission.description}</p>
                      <span className="inline-block text-xs text-gray-400 mt-1">
                        {getCategoryLabel(permission.category)}
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={permission.isEnabled}
                      onChange={(e) => {
                        // In a real app, this would update the permission
                        console.log(`Permission ${permission.name} ${e.target.checked ? 'enabled' : 'disabled'}`);
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="sr-only">Enable {permission.name}</span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Security Tips */}
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Security Tips
            </h3>
            <div className="space-y-2 text-sm text-yellow-800">
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Regularly review and update user permissions</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Enable two-factor authentication for admin accounts</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Monitor audit logs for suspicious activity</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                <p>Use strong, unique passwords for all accounts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
