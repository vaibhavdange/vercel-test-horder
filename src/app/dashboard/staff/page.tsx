"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, Edit, Trash2, SortAsc, User, CalendarIcon, Clock, Loader2, AlertCircle, CheckCircle, XCircle, MinusCircle, FileText } from "lucide-react";
import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from "@/hooks/use-staff";
import { useAttendance, useCreateAttendance, useUpdateAttendance, useDeleteAttendance, useBulkCreateAttendance } from "@/hooks/use-attendance";
import { useCategories } from "@/hooks/use-categories";
import { Staff, CreateStaffData, UpdateStaffData, StaffAttendance, CreateAttendanceData } from "@/types/staff";
import DevelopmentNotice from '@/components/ui/DevelopmentNotice';

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
  const bulkCreateAttendanceMutation = useBulkCreateAttendance();

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
      if (editingAttendance) {
        // Update existing attendance
        await updateAttendanceMutation.mutateAsync({
          id: editingAttendance.id,
          data: {
            id: editingAttendance.id,
            status: attendanceFormData.status,
            checkIn: attendanceFormData.checkIn,
            checkOut: attendanceFormData.checkOut,
            notes: attendanceFormData.notes,
          }
        });
        alert("Attendance updated successfully!");
      } else {
        // Create new attendance
        await createAttendanceMutation.mutateAsync(attendanceFormData);
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
      checkIn: attendance.checkIn ? attendance.checkIn.split('T')[0] + 'T' + attendance.checkIn.split('T')[1].substring(0, 5) : '',
      checkOut: attendance.checkOut ? attendance.checkOut.split('T')[0] + 'T' + attendance.checkOut.split('T')[1].substring(0, 5) : '',
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

  const handleBulkAttendance = async () => {
    if (staffMembers.length === 0) {
      alert("No staff members found");
      return;
    }

    const bulkData: CreateAttendanceData[] = staffMembers.map(staff => ({
      staffId: staff.id,
      date: selectedDate,
      status: "present",
      checkIn: "",
      checkOut: "",
      notes: "",
    }));

    try {
      await bulkCreateAttendanceMutation.mutateAsync(bulkData);
      alert("Bulk attendance created successfully!");
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Staff ({totalStaff})</h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddStaff(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Staff</span>
            </button>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center space-x-2">
              <SortAsc className="h-4 w-4" />
              <span>Sort by</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab("Staff Management")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === "Staff Management"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Staff Management
          </button>
          <button
            onClick={() => setActiveTab("Attendance")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              activeTab === "Attendance"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Attendance
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search staff by name, email, or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">All Roles</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
              <option value="Cashier">Cashier</option>
              <option value="Kitchen Staff">Kitchen Staff</option>
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
            <span className="ml-2 text-gray-600">Loading staff...</span>
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
          <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">
                      <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    </th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">ID</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Name</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Date</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Timings</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map((staff, index) => (
                    <tr key={staff.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">{staff.employeeId}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{staff.user.fullName}</div>
                            <div className="text-sm text-gray-500">{staff.user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {staff.dateOfBirth ? new Date(staff.dateOfBirth).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {staff.shiftStart && staff.shiftEnd ? `${staff.shiftStart} - ${staff.shiftEnd}` : 'N/A'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${
                            staff.isActive ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-600">
                            {staff.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-1 text-green-600 hover:text-green-700 transition-colors duration-200"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                            onClick={() => handleEditStaff(staff)}
                            title="Edit Staff"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="p-1 text-red-400 hover:text-red-600 transition-colors duration-200"
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

        {/* Attendance Tab */}
        {activeTab === "Attendance" && (
          <div className="space-y-6">
            {/* Attendance Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900">Attendance Management</h2>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowAttendanceModal(true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Attendance</span>
                </button>
                <button
                  onClick={handleBulkAttendance}
                  disabled={bulkCreateAttendanceMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  <CalendarIcon className="h-4 w-4" />
                  <span>Bulk Mark Present</span>
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            {attendanceLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Loading attendance...</span>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-4 px-6 font-medium text-gray-900">Staff</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900">Date</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900">Check In</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900">Check Out</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900">Notes</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceData?.attendance && attendanceData.attendance.length > 0 ? (
                        attendanceData.attendance.map((record) => (
                          <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                  <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {record.staff?.user?.fullName || 'N/A'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {record.staff?.user?.role || 'N/A'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              {new Date(record.date).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(record.status)}
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                  {record.status}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600">
                              {record.notes || 'N/A'}
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <button 
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                                  onClick={() => handleEditAttendance(record)}
                                  title="Edit Attendance"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  className="p-1 text-red-400 hover:text-red-600 transition-colors duration-200"
                                  onClick={() => handleDeleteAttendance(record.id)}
                                  title="Delete Attendance"
                                  disabled={deleteAttendanceMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-8 px-6 text-center text-gray-500">
                            No attendance records found for {new Date(selectedDate).toLocaleDateString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingStaff ? "Edit Staff" : "Add Staff"}
              </h3>
              <button
                onClick={() => setShowAddStaff(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
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

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStaff(false);
                      resetForm();
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  
                  {editingStaff ? (
                    <button
                      type="submit"
                      disabled={updateStaffMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {updateStaffMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Updating...</span>
                        </div>
                      ) : (
                        "Update Staff"
                      )}
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={createStaffMutation.isPending}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                    >
                      {createStaffMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Creating...</span>
                        </div>
                      ) : (
                        "Add Staff"
                      )}
                    </button>
                  )}
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
                    type="datetime-local"
                    name="checkIn"
                    value={attendanceFormData.checkIn}
                    onChange={handleAttendanceInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Check Out</label>
                  <input
                    type="datetime-local"
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

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAttendanceModal(false);
                    resetAttendanceForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                >
                  Cancel
                </button>
                
                {editingAttendance ? (
                  <button
                    type="submit"
                    disabled={updateAttendanceMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {updateAttendanceMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </div>
                    ) : (
                      "Update Attendance"
                    )}
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={createAttendanceMutation.isPending}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50"
                  >
                    {createAttendanceMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      "Create Attendance"
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
      
      <DevelopmentNotice />
    </div>
  );
}
