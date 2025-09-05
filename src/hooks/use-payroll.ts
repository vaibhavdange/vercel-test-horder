import { useQuery } from '@tanstack/react-query';
import { useStaff } from './use-staff';
import { useAttendance } from './use-attendance';
import { PayrollPeriod } from '@/components/staff/payroll-utils';

interface UsePayrollProps {
  period: PayrollPeriod;
}

export const usePayroll = ({ period }: UsePayrollProps) => {
  // Fetch staff data
  const { data: staffData, isLoading: staffLoading, error: staffError } = useStaff();
  
  // Fetch attendance data for the period
  const { data: attendanceData, isLoading: attendanceLoading, error: attendanceError } = useAttendance({
    dateFrom: period.startDate,
    dateTo: period.endDate,
    limit: 1000 // Get all attendance records for the period
  });

  const isLoading = staffLoading || attendanceLoading;
  const error = staffError || attendanceError;

  return {
    staffData: staffData?.staff || [],
    attendanceData: attendanceData?.attendance || [],
    isLoading,
    error
  };
};
