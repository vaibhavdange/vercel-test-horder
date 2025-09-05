"use client";
import React from "react";
import { PayrollPeriod, getCurrentMonthPeriod, getMonthPeriod, getMonthName } from "./payroll-utils";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface PayrollPeriodSelectorProps {
  period: PayrollPeriod;
  onPeriodChange: (period: PayrollPeriod) => void;
}

export function PayrollPeriodSelector({ period, onPeriodChange }: PayrollPeriodSelectorProps) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const handlePreviousMonth = () => {
    const periodDate = new Date(period.startDate);
    const newYear = periodDate.getMonth() === 0 ? periodDate.getFullYear() - 1 : periodDate.getFullYear();
    const newMonth = periodDate.getMonth() === 0 ? 12 : periodDate.getMonth();
    
    const newPeriod = getMonthPeriod(newYear, newMonth);
    onPeriodChange(newPeriod);
  };

  const handleNextMonth = () => {
    const periodDate = new Date(period.startDate);
    const newYear = periodDate.getMonth() === 11 ? periodDate.getFullYear() + 1 : periodDate.getFullYear();
    const newMonth = periodDate.getMonth() === 11 ? 1 : periodDate.getMonth() + 2;
    
    const newPeriod = getMonthPeriod(newYear, newMonth);
    onPeriodChange(newPeriod);
  };

  const handleCurrentMonth = () => {
    const currentPeriod = getCurrentMonthPeriod();
    onPeriodChange(currentPeriod);
  };

  const periodDate = new Date(period.startDate);
  const monthName = getMonthName(periodDate.getMonth() + 1);
  const year = periodDate.getFullYear();

  return (
    <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Pay Period:</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePreviousMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          </button>
          
          <div className="text-center min-w-[120px]">
            <div className="text-lg font-semibold text-gray-900">
              {monthName} {year}
            </div>
            <div className="text-xs text-gray-500">
              {period.daysInPeriod} days
            </div>
          </div>
          
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button
          onClick={handleCurrentMonth}
          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
            period.startDate === getCurrentMonthPeriod().startDate
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Current Month
        </button>
      </div>
    </div>
  );
}
