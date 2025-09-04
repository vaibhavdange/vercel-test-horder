"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, SortAsc, User, Clock, Loader2, AlertCircle, CheckCircle, XCircle, MinusCircle, FileText, Search, X } from "lucide-react";
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from "@/hooks/use-staff";
import { useAttendance, useCreateAttendance, useUpdateAttendance, useDeleteAttendance } from "@/hooks/use-attendance";
import { useCategories } from "@/hooks/use-categories";
import { Staff, CreateStaffData, UpdateStaffData, StaffAttendance, CreateAttendanceData } from "@/types/staff";
// import DevelopmentNotice from '@/components/ui/DevelopmentNotice';

export default function StaffPage() {
  const [activeTab, setActiveTab] = useState("Staff Management");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  
  // Attendance state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<StaffAttendance | null>(null);
  const [attendanceFormData, setAttendanceFormData] = useState<CreateAttendanceData>({
    staffId: "",
    date: new Date().toISOString().split('T')[0],
    status: "present",
    checkIn: "",
    checkOut: "",
    notes: "",
  });

  // Fetch staff data
  const { data: staffData, isLoading, error } = useStaff({
    search: searchTerm || undefined,
    role: selectedRole || undefined,
  });

  const staffMembers = staffData?.staff || [];
  const totalStaff = staffData?.pagination?.total || 0;

  // Mutations
  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();
  
  // Attendance hooks
  const { data: attendanceData, isLoading: attendanceLoading } = useAttendance({
    date: selectedDate,
    limit: 100
  });
  
  const createAttendanceMutation = useCreateAttendance();
  const updateAttendanceMutation = useUpdateAttendance();
  const deleteAttendanceMutation = useDeleteAttendance();

  const statusOptions = ["present", "absent", "half-shift", "leave"];

  // Form state
  const [formData, setFormData] = useState<CreateStaffData>({
    username: "",
    password: "",
    fullName: "",
    email: "",
    phone: "",
    role: "",
    employeeId: "",
    profilePicture: "",
    dateOfBirth: "",
    salary: 0,
    shiftStart: "",
    shiftEnd: "",
    address: "",
    additionalDetails: "",
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      fullName: "",
      email: "",
      phone: "",
      role: "",
      employeeId: "",
      profilePicture: "",
      dateOfBirth: "",
      salary: 0,
      shiftStart: "",
      shiftEnd: "",
      address: "",
      additionalDetails: "",
    });
    setEditingStaff(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingStaff) {
        // Update existing staff
        const updateData: UpdateStaffData = {
          id: editingStaff.id,
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          employeeId: formData.employeeId,
          profilePicture: formData.profilePicture,
          dateOfBirth: formData.dateOfBirth,
          salary: formData.salary,
          shiftStart: formData.shiftStart,
          shiftEnd: formData.shiftEnd,
          address: formData.address,
          additionalDetails: formData.additionalDetails,
        };
        
        await updateStaffMutation.mutateAsync(updateData);
        alert("Staff member updated successfully!");
      } else {
        // Create new staff
        await createStaffMutation.mutateAsync(formData);
        alert("Staff member created successfully!");
      }
      
      setShowAddStaff(false);
      resetForm();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle edit staff
  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setFormData({
      username: staff.user.username,
      password: "", // Don't populate password for editing
      fullName: staff.user.fullName,
      email: staff.user.email,
      phone: staff.user.phone || "",
      role: staff.user.role,
      employeeId: staff.employeeId,
      profilePicture: staff.profilePicture || "",
      dateOfBirth: staff.dateOfBirth || "",
      salary: staff.salary || 0,
      shiftStart: staff.shiftStart || "",
      shiftEnd: staff.shiftEnd || "",
      address: staff.address || "",
      additionalDetails: staff.additionalDetails || "",
    });
    setShowAddStaff(true);
  };

  // Handle delete staff
  const handleDeleteStaff = async (staffId: string, staffName: string) => {
    if (confirm(`Are you sure you want to delete ${staffName}? This action cannot be undone.`)) {
      try {
        await deleteStaffMutation.mutateAsync(staffId);
        alert("Staff member deleted successfully!");
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'salary' ? parseFloat(value) || 0 : value
    }));
  };

  // Attendance functions
  const handleAttendanceInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAttendanceFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare form data with proper datetime formatting
      const formData = {
        ...attendanceFormData,
        checkIn: attendanceFormData.checkIn ? `${attendanceFormData.date}T${attendanceFormData.checkIn}:00` : undefined,
        checkOut: attendanceFormData.checkOut ? `${attendanceFormData.date}T${attendanceFormData.checkOut}:00` : undefined,
      };

      if (editingAttendance) {
        // Update existing attendance
        await updateAttendanceMutation.mutateAsync({
          id: editingAttendance.id,
          data: {
            id: editingAttendance.id,
            status: formData.status,
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            notes: formData.notes,
          }
        });
        alert("Attendance updated successfully!");
      } else {
        // Validate required fields for new attendance
        if (!formData.staffId) {
          alert("Please select a staff member");
          return;
        }
        if (!formData.status) {
          alert("Please select a status");
          return;
        }
        
        // Create new attendance
        await createAttendanceMutation.mutateAsync(formData);
        alert("Attendance recorded successfully!");
      }
      
      setShowAttendanceModal(false);
      resetAttendanceForm();
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEditAttendance = (attendance: StaffAttendance) => {
    setEditingAttendance(attendance);
    setAttendanceFormData({
      staffId: attendance.staffId,
      date: attendance.date.split('T')[0],
      status: attendance.status,
      checkIn: attendance.checkIn ? attendance.checkIn.split('T')[1]?.substring(0, 5) || '' : '',
      checkOut: attendance.checkOut ? attendance.checkOut.split('T')[1]?.substring(0, 5) || '' : '',
      notes: attendance.notes || '',
    });
    setShowAttendanceModal(true);
  };

  const handleDeleteAttendance = async (attendanceId: string) => {
    if (confirm("Are you sure you want to delete this attendance record?")) {
      try {
        await deleteAttendanceMutation.mutateAsync(attendanceId);
        alert("Attendance record deleted successfully!");
      } catch (error) {
        alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const resetAttendanceForm = () => {
    setAttendanceFormData({
      staffId: "",
      date: selectedDate,
      status: "present",
      checkIn: "",
      checkOut: "",
      notes: "",
    });
    setEditingAttendance(null);
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'half-shift':
        return <MinusCircle className="h-4 w-4 text-yellow-500" />;
      case 'leave':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <MinusCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      case 'half-shift':
        return 'bg-yellow-100 text-yellow-800';
      case 'leave':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full">
      
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setActiveTab("Staff Management")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    activeTab === "Staff Management" 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Staff Management
                </button>
                <button
                  onClick={() => setActiveTab("Attendance")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
                    activeTab === "Attendance" 
                      ? 'bg-gray-900 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Attendance
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {activeTab === "Staff Management" && (
                <button
                  onClick={() => setShowAddStaff(true)}
                  className="p-2 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center space-x-2 whitespace-nowrap shrink-0 text-sm font-medium"
                  title="Add Staff Member"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Staff</span>
                </button>
              )}
              {activeTab === "Attendance" && (
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="p-2 sm:px-4 sm:py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center space-x-2 whitespace-nowrap shrink-0 text-sm font-medium"
                  title="Add Attendance"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Attendance</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Filters Row - Only show for Staff Management tab */}
        {activeTab === "Staff Management" && (
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            {/* Search */}
          <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search staff by name, email, or employee ID..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
            </div>
            
            {/* Role Filter */}
          <div className="sm:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Roles</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
              <option value="Cashier">Cashier</option>
              <option value="Kitchen Staff">Kitchen Staff</option>
            </select>
          </div>
            
            {/* Reset Button */}
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedRole("");
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              Reset
            </button>
        </div>
        )}

        {/* Loading and Error States */}
        {isLoading && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading staff...</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-8 text-red-600">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span>Error loading staff: {error.message}</span>
          </div>
        )}

        {/* Staff Table */}
        {activeTab === "Staff Management" && !isLoading && !error && (
          <div className="w-full">
            {staffMembers.length === 0 ? (
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
            ) : (
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
                            onClick={() => handleEditStaff(staff)}
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
            )}
          </div>
        )}

        {/* Attendance Tab */}
        {activeTab === "Attendance" && (
          <div className="space-y-6">
            {/* Attendance Header */}
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

            {/* Attendance Table */}
            {attendanceLoading ? (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-6 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading attendance...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full">
                {attendanceData?.attendance && attendanceData.attendance.length > 0 ? (
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
                              {new Date(record.date).toLocaleDateString()}
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
                              {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                </div>
                            </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                              {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
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
                                  onClick={() => handleEditAttendance(record)}
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
                ) : (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <Clock className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance records found</h3>
                    <p className="text-gray-600">
                      No attendance records found for this date. Click "Add Attendance" to create one.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStaff ? "Edit Staff" : "Add Staff"}
              </h3>
              <button
                onClick={() => setShowAddStaff(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                  <div className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors duration-200 cursor-pointer">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <button type="button" className="text-sm text-green-600 hover:text-green-700 mt-1">Change Profile Picture</button>
                </div>

                {!editingStaff && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        placeholder="Enter username"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                      <input
                        type="text"
                        name="employeeId"
                        value={formData.employeeId}
                        onChange={handleInputChange}
                        placeholder="Enter employee ID"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select role</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Kitchen Staff">Kitchen Staff</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    placeholder="Enter salary"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shift Start</label>
                    <input
                      type="time"
                      name="shiftStart"
                      value={formData.shiftStart}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shift End</label>
                    <input
                      type="time"
                      name="shiftEnd"
                      value={formData.shiftEnd}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter address"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
                  <textarea
                    name="additionalDetails"
                    value={formData.additionalDetails}
                    onChange={handleInputChange}
                    placeholder="Enter additional details"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center justify-center"
                    disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
                  >
                    {createStaffMutation.isPending || updateStaffMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <span>{editingStaff ? 'Update' : 'Create'}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStaff(false);
                      resetForm();
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingAttendance ? "Edit Attendance" : "Add Attendance"}
              </h3>
              <button
                onClick={() => setShowAttendanceModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitAttendance} className="space-y-4">
              {!editingAttendance && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
                  <select
                    name="staffId"
                    value={attendanceFormData.staffId}
                    onChange={handleAttendanceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select staff member</option>
                    {staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.user.fullName} - {staff.employeeId}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  name="date"
                  value={attendanceFormData.date}
                  onChange={handleAttendanceInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  name="status"
                  value={attendanceFormData.status}
                  onChange={handleAttendanceInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half-shift">Half Shift</option>
                  <option value="leave">Leave</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check In</label>
                  <input
                    type="time"
                    name="checkIn"
                    value={attendanceFormData.checkIn}
                    onChange={handleAttendanceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check Out</label>
                  <input
                    type="time"
                    name="checkOut"
                    value={attendanceFormData.checkOut}
                    onChange={handleAttendanceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  value={attendanceFormData.notes}
                  onChange={handleAttendanceInputChange}
                  placeholder="Enter any additional notes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center justify-center"
                  disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
                >
                  {createAttendanceMutation.isPending || updateAttendanceMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <span>{editingAttendance ? 'Update' : 'Create'}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAttendanceModal(false);
                    resetAttendanceForm();
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* <DevelopmentNotice /> */}
    </div>
  );
}
