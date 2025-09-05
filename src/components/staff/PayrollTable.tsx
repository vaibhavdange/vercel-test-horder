"use client";
import React from "react";
import { Staff, StaffAttendance } from "@/types/staff";
import { PayrollCalculation, PayrollPeriod, calculatePayroll, formatCurrency } from "./payroll-utils";
import { User, DollarSign, Calendar, Clock } from "lucide-react";

interface PayrollTableProps {
  staffData: Staff[];
  attendanceData: StaffAttendance[];
  period: PayrollPeriod;
  isLoading?: boolean;
}

export function PayrollTable({ staffData, attendanceData, period, isLoading }: PayrollTableProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payroll data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!staffData || staffData.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <User className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
        <p className="text-gray-600">
          Add staff members to view payroll information.
        </p>
      </div>
    );
  }

  // Calculate total payroll for all staff
  const totalPayroll = staffData.reduce((total, staff) => {
    const staffAttendance = attendanceData.filter(a => a.staffId === staff.id);
    const payroll = calculatePayroll(staff, staffAttendance, period);
    return total + payroll.netPay;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Payroll Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-medium text-gray-900">Payroll Summary</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Payroll</p>
                <p className="text-xl font-semibold text-gray-900">{formatCurrency(totalPayroll)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <User className="h-6 w-6 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Staff Members</p>
                <p className="text-xl font-semibold text-gray-900">{staffData.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center">
              <Clock className="h-6 w-6 text-gray-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Period Days</p>
                <p className="text-xl font-semibold text-gray-900">{period.daysInPeriod}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Salary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Present
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Half Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Absent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Pay
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deductions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Pay
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffData.map((staff) => {
                const staffAttendance = attendanceData.filter(a => a.staffId === staff.id);
                const payroll: PayrollCalculation = calculatePayroll(staff, staffAttendance, period);
                
                return (
                  <tr key={staff.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {staff.user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {staff.employeeId} • {staff.user.role}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(payroll.baseSalary)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payroll.presentDays}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payroll.halfDays}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payroll.leaveDays}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {payroll.absentDays}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(payroll.grossPay)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatCurrency(payroll.deductions)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(payroll.netPay)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
