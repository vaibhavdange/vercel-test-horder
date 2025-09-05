"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateAttendance, useUpdateAttendance } from "@/hooks/use-attendance";
import { useStaff } from "@/hooks/use-staff";
import { toast } from "sonner";
import { StaffAttendance, CreateAttendanceData, UpdateAttendanceData } from "@/types/staff";

const attendanceSchema = z.object({
  staffId: z.string().min(1, "Staff member is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "half-shift", "leave"], {
    required_error: "Status is required",
  }),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().optional(),
});

type AttendanceFormData = z.infer<typeof attendanceSchema>;

interface AttendanceFormProps {
  open: boolean;
  onClose: () => void;
  editingAttendance?: StaffAttendance | null;
  selectedDate?: string;
}

export function AttendanceForm({ 
  open, 
  onClose, 
  editingAttendance, 
  selectedDate = new Date().toISOString().split('T')[0] 
}: AttendanceFormProps) {
  const { data: staffData } = useStaff();
  const staffMembers = staffData?.staff || [];

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AttendanceFormData>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      staffId: "",
      date: selectedDate,
      status: "present",
      checkIn: "",
      checkOut: "",
      notes: "",
    }
  });

  // Reset form when editingAttendance changes
  React.useEffect(() => {
    if (editingAttendance) {
      reset({
        staffId: editingAttendance.staffId,
        date: editingAttendance.date.split('T')[0],
        status: editingAttendance.status as "present" | "absent" | "half-shift" | "leave",
        checkIn: editingAttendance.checkIn ? editingAttendance.checkIn.split('T')[1]?.substring(0, 5) || '' : '',
        checkOut: editingAttendance.checkOut ? editingAttendance.checkOut.split('T')[1]?.substring(0, 5) || '' : '',
        notes: editingAttendance.notes || '',
      });
    } else {
      reset({
        staffId: "",
        date: selectedDate,
        status: "present",
        checkIn: "",
        checkOut: "",
        notes: "",
      });
    }
  }, [editingAttendance, selectedDate, reset]);

  const createAttendanceMutation = useCreateAttendance();
  const updateAttendanceMutation = useUpdateAttendance();

  const onSubmit = async (data: AttendanceFormData) => {
    try {
      // Prepare form data with proper datetime formatting
      const formData = {
        ...data,
        checkIn: data.checkIn ? `${data.date}T${data.checkIn}:00` : undefined,
        checkOut: data.checkOut ? `${data.date}T${data.checkOut}:00` : undefined,
      };

      if (editingAttendance) {
        // Update existing attendance
        const updateData: UpdateAttendanceData = {
          id: editingAttendance.id,
          status: formData.status,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          notes: formData.notes,
        };
        
        await updateAttendanceMutation.mutateAsync({
          id: editingAttendance.id,
          data: updateData
        });
        toast.success("Attendance updated successfully!");
      } else {
        // Create new attendance
        const createData: CreateAttendanceData = {
          staffId: formData.staffId,
          date: formData.date,
          status: formData.status,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          notes: formData.notes,
        };
        
        await createAttendanceMutation.mutateAsync(createData);
        toast.success("Attendance recorded successfully!");
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingAttendance ? "Edit Attendance" : "Add Attendance"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!editingAttendance && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Staff Member</label>
              <select
                {...register("staffId")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select staff member</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.user.fullName} - {staff.employeeId}
                  </option>
                ))}
              </select>
              {errors.staffId && <p className="text-red-500 text-sm mt-1">{errors.staffId.message}</p>}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              {...register("date")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half-shift">Half Shift</option>
              <option value="leave">Leave</option>
            </select>
            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check In</label>
              <input
                type="time"
                {...register("checkIn")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.checkIn && <p className="text-red-500 text-sm mt-1">{errors.checkIn.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Check Out</label>
              <input
                type="time"
                {...register("checkOut")}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {errors.checkOut && <p className="text-red-500 text-sm mt-1">{errors.checkOut.message}</p>}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              {...register("notes")}
              placeholder="Enter any additional notes..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            {errors.notes && <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              className="flex-1 px-6 py-2 bg-gray-900 text-white rounded-full hover:bg-black transition-colors duration-200 flex items-center justify-center"
              disabled={createAttendanceMutation.isPending || updateAttendanceMutation.isPending}
            >
              {createAttendanceMutation.isPending || updateAttendanceMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <span>{editingAttendance ? 'Update' : 'Create'}</span>
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
