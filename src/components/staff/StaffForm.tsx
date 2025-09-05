"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateStaff, useUpdateStaff } from "@/hooks/use-staff";
import { toast } from "sonner";
import { Staff, CreateStaffData, UpdateStaffData } from "@/types/staff";
import { User, X } from "lucide-react";

const staffSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  role: z.string().min(1, "Role is required"),
  employeeId: z.string().min(1, "Employee ID is required"),
  profilePicture: z.string().optional(),
  dateOfBirth: z.string().optional(),
  salary: z.number().min(0, "Salary must be non-negative"),
  shiftStart: z.string().optional(),
  shiftEnd: z.string().optional(),
  address: z.string().optional(),
  additionalDetails: z.string().optional(),
});

type StaffFormData = z.infer<typeof staffSchema>;

interface StaffFormProps {
  open: boolean;
  onClose: () => void;
  editingStaff?: Staff | null;
}

export function StaffForm({ open, onClose, editingStaff }: StaffFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
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
    }
  });

  // Reset form when editingStaff changes
  React.useEffect(() => {
    if (editingStaff) {
      reset({
        username: editingStaff.user.username,
        password: "",
        fullName: editingStaff.user.fullName,
        email: editingStaff.user.email,
        phone: editingStaff.user.phone || "",
        role: editingStaff.user.role,
        employeeId: editingStaff.employeeId,
        profilePicture: editingStaff.profilePicture || "",
        dateOfBirth: editingStaff.dateOfBirth || "",
        salary: editingStaff.salary || 0,
        shiftStart: editingStaff.shiftStart || "",
        shiftEnd: editingStaff.shiftEnd || "",
        address: editingStaff.address || "",
        additionalDetails: editingStaff.additionalDetails || "",
      });
    } else {
      reset({
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
    }
  }, [editingStaff, reset]);

  const createStaffMutation = useCreateStaff();
  const updateStaffMutation = useUpdateStaff();

  const onSubmit = async (data: StaffFormData) => {
    try {
      if (editingStaff) {
        // Update existing staff
        const updateData: UpdateStaffData = {
          id: editingStaff.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          employeeId: data.employeeId,
          profilePicture: data.profilePicture,
          dateOfBirth: data.dateOfBirth,
          salary: data.salary,
          shiftStart: data.shiftStart,
          shiftEnd: data.shiftEnd,
          address: data.address,
          additionalDetails: data.additionalDetails,
        };
        
        await updateStaffMutation.mutateAsync(updateData);
        toast.success("Staff member updated successfully!");
      } else {
        // Create new staff
        const createData: CreateStaffData = {
          username: data.username,
          password: data.password!,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          employeeId: data.employeeId,
          profilePicture: data.profilePicture,
          dateOfBirth: data.dateOfBirth,
          salary: data.salary,
          shiftStart: data.shiftStart,
          shiftEnd: data.shiftEnd,
          address: data.address,
          additionalDetails: data.additionalDetails,
        };
        
        await createStaffMutation.mutateAsync(createData);
        toast.success("Staff member created successfully!");
      }
      
      reset();
      onClose();
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingStaff ? "Edit Staff" : "Add Staff"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    {...register("username")}
                    placeholder="Enter username"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    {...register("password")}
                    placeholder="Enter password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                  <input
                    {...register("employeeId")}
                    placeholder="Enter employee ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {errors.employeeId && <p className="text-red-500 text-sm mt-1">{errors.employeeId.message}</p>}
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                {...register("fullName")}
                placeholder="Enter full name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                {...register("email")}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                {...register("role")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select role</option>
                <option value="Manager">Manager</option>
                <option value="Staff">Staff</option>
                <option value="Cashier">Cashier</option>
                <option value="Kitchen Staff">Kitchen Staff</option>
              </select>
              {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input
                type="tel"
                {...register("phone")}
                placeholder="Enter phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Salary</label>
              <input
                type="number"
                {...register("salary", { valueAsNumber: true })}
                placeholder="Enter salary"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.salary && <p className="text-red-500 text-sm mt-1">{errors.salary.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
              <input
                type="date"
                {...register("dateOfBirth")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift Start</label>
                <input
                  type="time"
                  {...register("shiftStart")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {errors.shiftStart && <p className="text-red-500 text-sm mt-1">{errors.shiftStart.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Shift End</label>
                <input
                  type="time"
                  {...register("shiftEnd")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {errors.shiftEnd && <p className="text-red-500 text-sm mt-1">{errors.shiftEnd.message}</p>}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                {...register("address")}
                placeholder="Enter address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional Details</label>
              <textarea
                {...register("additionalDetails")}
                placeholder="Enter additional details"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.additionalDetails && <p className="text-red-500 text-sm mt-1">{errors.additionalDetails.message}</p>}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                className="flex-1 px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center justify-center"
                disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
              >
                {createStaffMutation.isPending || updateStaffMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <span>{editingStaff ? 'Update' : 'Create'}</span>
                )}
              </Button>
              <Button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
