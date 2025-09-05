"use client";
import React from "react";
import { useAttendance, useDeleteAttendance } from "@/hooks/use-attendance";
import { Loader2, AlertCircle, Clock, User, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { StaffAttendance } from "@/types/staff";
import { getStatusIcon, getStatusColor, formatTime, formatDate } from "./utils";

interface AttendanceTableProps {
  selectedDate: string;
  onEditAttendance: (attendance: StaffAttendance) => void;
}

export function AttendanceTable({ selectedDate, onEditAttendance }: AttendanceTableProps) {
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendance({
    date: selectedDate,
    limit: 100
  });
  
  const deleteAttendanceMutation = useDeleteAttendance();

  if (attendanceLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading attendance...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDeleteAttendance = async (attendanceId: string) => {
    if (confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await deleteAttendanceMutation.mutateAsync(attendanceId);
        toast.success("Attendance record deleted successfully!");
      } catch (error) {
        toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  if (!attendanceData?.attendance || attendanceData.attendance.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Clock className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
        <p className="text-gray-600">
          No attendance records found for this date. Click "Add Attendance" to create one.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {attendanceData.attendance.map((record) => (
              <tr key={record.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {record.staff?.user?.fullName || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {record.staff?.user?.role || 'N/A'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatDate(record.date)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(record.status)}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatTime(record.checkIn || null)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatTime(record.checkOut || null)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {record.notes || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => onEditAttendance(record)}
                      title="Edit Attendance"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteAttendance(record.id)}
                      title="Delete Attendance"
                      disabled={deleteAttendanceMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
