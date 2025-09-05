"use client";
import React from "react";
import { useStaff, useDeleteStaff } from "@/hooks/use-staff";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, User, Eye, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Staff } from "@/types/staff";

interface StaffTableProps {
  searchTerm: string;
  selectedRole: string;
  onEditStaff: (staff: Staff) => void;
}

export function StaffTable({ searchTerm, selectedRole, onEditStaff }: StaffTableProps) {
  const { data: staffData, isLoading, error } = useStaff({
    search: searchTerm || undefined,
    role: selectedRole || undefined,
  });

  const staffMembers = staffData?.staff || [];
  const deleteStaffMutation = useDeleteStaff();

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading staff...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="h-6 w-6 mr-2" />
        <span>Error loading staff: {error.message}</span>
      </div>
    );
  }

  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      try {
        await deleteStaffMutation.mutateAsync(staffId);
        toast.success("Staff member deleted successfully!");
      } catch (error) {
        toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  if (staffMembers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <User className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
        <p className="text-gray-600">
          {searchTerm || selectedRole
            ? "Try adjusting your search or filters"
            : "Add your first staff member to get started"
          }
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffMembers.map((staff) => (
              <tr key={staff.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{staff.employeeId}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{staff.user.fullName}</div>
                      <div className="text-sm text-gray-500">{staff.user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{staff.user.role}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{staff.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{staff.user.phone || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    staff.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {staff.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-blue-600 hover:text-blue-900"
                      onClick={() => onEditStaff(staff)}
                      title="Edit Staff"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteStaff(staff.id, staff.user.fullName)}
                      title="Delete Staff"
                      disabled={deleteStaffMutation.isPending}
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
