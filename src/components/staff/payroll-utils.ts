import { Staff, StaffAttendance } from "@/types/staff";

export interface PayrollCalculation {
  baseSalary: number;
  presentDays: number;
  halfDays: number;
  leaveDays: number;
  absentDays: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  dailyRate: number;
  totalDaysInPeriod: number;
}

export interface PayrollPeriod {
  startDate: string;
  endDate: string;
  daysInPeriod: number;
}

/**
 * Calculate payroll for a staff member based on their attendance
 */
export const calculatePayroll = (
  staff: Staff,
  attendance: StaffAttendance[],
  period: PayrollPeriod
): PayrollCalculation => {
  const baseSalary = staff.salary || 0;
  const dailyRate = baseSalary / period.daysInPeriod;

  // Filter attendance for the specific period
  const periodAttendance = attendance.filter(record => {
    const recordDate = new Date(record.date);
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    return recordDate >= startDate && recordDate <= endDate;
  });

  const presentDays = periodAttendance.filter(a => a.status === "present").length;
  const halfDays = periodAttendance.filter(a => a.status === "half-shift").length;
  const leaveDays = periodAttendance.filter(a => a.status === "leave").length;
  const absentDays = periodAttendance.filter(a => a.status === "absent").length;

  // Calculate gross pay
  const grossPay = 
    (presentDays * dailyRate) + 
    (halfDays * dailyRate * 0.5) + 
    (leaveDays * dailyRate); // Assuming leave is paid, adjust as needed

  // For now, no deductions - can be extended later for tax, etc.
  const deductions = 0;
  const netPay = grossPay - deductions;

  return {
    baseSalary,
    presentDays,
    halfDays,
    leaveDays,
    absentDays,
    grossPay,
    deductions,
    netPay,
    dailyRate,
    totalDaysInPeriod: period.daysInPeriod
  };
};

/**
 * Generate payroll period for current month
 */
export const getCurrentMonthPeriod = (): PayrollPeriod => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    daysInPeriod: endDate.getDate()
  };
};

/**
 * Generate payroll period for a specific month/year
 */
export const getMonthPeriod = (year: number, month: number): PayrollPeriod => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    daysInPeriod: endDate.getDate()
  };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number, currency: string = "₹"): string => {
  return `${currency}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

/**
 * Get month name from month number
 */
export const getMonthName = (month: number): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month - 1] || "";
};
