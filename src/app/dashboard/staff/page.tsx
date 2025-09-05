"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, StaffTable, AttendanceTable, StaffForm, AttendanceForm, SearchBar } from "@/components/staff";
import { PayrollTable } from "@/components/staff/PayrollTable";
import { PayrollPeriodSelector } from "@/components/staff/PayrollPeriodSelector";
import { Staff, StaffAttendance } from "@/types/staff";
import { PayrollPeriod, getCurrentMonthPeriod } from "@/components/staff/payroll-utils";
import { usePayroll } from "@/hooks/use-payroll";

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState<"staff" | "attendance" | "payroll">("staff");
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [editingAttendance, setEditingAttendance] = useState<StaffAttendance | null>(null);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  
  // Attendance state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Payroll state
  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriod>(getCurrentMonthPeriod());
  
  // Payroll data
  const { staffData, attendanceData, isLoading: payrollLoading } = usePayroll({ period: payrollPeriod });

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setShowStaffForm(true);
  };

  const handleEditAttendance = (attendance: StaffAttendance) => {
    setEditingAttendance(attendance);
    setShowAttendanceForm(true);
  };

  const handleCloseStaffForm = () => {
    setShowStaffForm(false);
    setEditingStaff(null);
  };

  const handleCloseAttendanceForm = () => {
    setShowAttendanceForm(false);
    setEditingAttendance(null);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedRole("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === "staff" && (
                <Button
                  onClick={() => setShowStaffForm(true)}
                  className="p-2 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center space-x-2 whitespace-nowrap shrink-0 text-sm font-medium"
                  title="Add Staff Member"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Staff</span>
                </Button>
              )}
              {activeTab === "attendance" && (
                <Button
                  onClick={() => setShowAttendanceForm(true)}
                  className="p-2 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center space-x-2 whitespace-nowrap shrink-0 text-sm font-medium"
                  title="Add Attendance"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Attendance</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters - Only show for Staff Management tab */}
        {activeTab === "staff" && (
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
            onReset={handleResetFilters}
          />
        )}

        {/* Attendance Date Selector - Only show for Attendance tab */}
        {activeTab === "attendance" && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        )}

        {/* Tables */}
        {activeTab === "staff" && (
          <StaffTable
            searchTerm={searchTerm}
            selectedRole={selectedRole}
            onEditStaff={handleEditStaff}
          />
        )}
        
        {activeTab === "attendance" && (
          <AttendanceTable
            selectedDate={selectedDate}
            onEditAttendance={handleEditAttendance}
          />
        )}
        
        {activeTab === "payroll" && (
          <div className="space-y-6">
            <PayrollPeriodSelector
              period={payrollPeriod}
              onPeriodChange={setPayrollPeriod}
            />
            <PayrollTable
              staffData={staffData}
              attendanceData={attendanceData}
              period={payrollPeriod}
              isLoading={payrollLoading}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <StaffForm
        open={showStaffForm}
        onClose={handleCloseStaffForm}
        editingStaff={editingStaff}
      />
      
      <AttendanceForm
        open={showAttendanceForm}
        onClose={handleCloseAttendanceForm}
        editingAttendance={editingAttendance}
        selectedDate={selectedDate}
      />
    </div>
  );
}