import React from "react";

export function Tabs({
  activeTab,
  setActiveTab,
}: {
  activeTab: "staff" | "attendance" | "payroll";
  setActiveTab: (tab: "staff" | "attendance" | "payroll") => void;
}) {
  return (
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setActiveTab("staff")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
          activeTab === "staff" 
            ? 'bg-gray-900 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Staff Management
      </button>
      <button
        onClick={() => setActiveTab("attendance")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
          activeTab === "attendance" 
            ? 'bg-gray-900 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Attendance
      </button>
      <button
        onClick={() => setActiveTab("payroll")}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
          activeTab === "payroll" 
            ? 'bg-gray-900 text-white' 
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        Payroll
      </button>
    </div>
  );
}
