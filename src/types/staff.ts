export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Staff {
  id: string;
  userId: string;
  employeeId: string;
  profilePicture?: string;
  dateOfBirth?: string;
  salary?: number;
  shiftStart?: string;
  shiftEnd?: string;
  address?: string;
  additionalDetails?: string;
  hireDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: User;
  attendance?: StaffAttendance[];
}

export interface StaffAttendance {
  id: string;
  staffId: string;
  date: string;
  status: 'present' | 'absent' | 'half-shift' | 'leave';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  staff?: {
    id: string;
    userId: string;
    employeeId: string;
    user: {
      id: string;
      fullName: string;
      email: string;
      role: string;
    };
  };
}

export interface CreateStaffData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone?: string;
  role: string;
  employeeId: string;
  profilePicture?: string;
  dateOfBirth?: string;
  salary?: number;
  shiftStart?: string;
  shiftEnd?: string;
  address?: string;
  additionalDetails?: string;
}

export interface UpdateStaffData {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  employeeId?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  salary?: number;
  shiftStart?: string;
  shiftEnd?: string;
  address?: string;
  additionalDetails?: string;
  isActive?: boolean;
}

export interface CreateAttendanceData {
  staffId: string;
  date: string;
  status: 'present' | 'absent' | 'half-shift' | 'leave';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export interface UpdateAttendanceData {
  id: string;
  status?: 'present' | 'absent' | 'half-shift' | 'leave';
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export interface StaffFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
}
