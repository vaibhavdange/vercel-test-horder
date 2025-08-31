"use client";

import { useState, useEffect } from "react";
import { Clock, CheckCircle, AlertCircle } from "lucide-react";
import { parseSupabaseTimestamp } from "@/lib/time";

interface KitchenTimerProps {
  createdAt: string;
  startedCookingAt?: string;
  readyAt?: string;
  updatedAt?: string;
  status: string;
}

export default function KitchenTimer({ createdAt, startedCookingAt, readyAt, updatedAt, status }: KitchenTimerProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = parseSupabaseTimestamp(startTime);
    const end = endTime ? parseSupabaseTimestamp(endTime) : currentTime;
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const getTimerInfo = () => {
    switch (status) {
      case "pending":
        return {
          icon: <Clock className="h-3 w-3 text-yellow-500" />,
          text: formatDuration(createdAt),
          color: "text-yellow-600"
        };
      case "in-process":
        if (startedCookingAt) {
          return {
            icon: <Clock className="h-3 w-3 text-orange-500" />,
            text: formatDuration(startedCookingAt),
            color: "text-orange-600"
          };
        } else {
          return {
            icon: <Clock className="h-3 w-3 text-orange-500" />,
            text: formatDuration(createdAt),
            color: "text-orange-600"
          };
        }
      case "ready":
        if (readyAt) {
          return {
            icon: <CheckCircle className="h-3 w-3 text-green-500" />,
            text: formatDuration(createdAt, readyAt),
            color: "text-green-600"
          };
        } else {
          return {
            icon: <CheckCircle className="h-3 w-3 text-green-500" />,
            text: "Ready",
            color: "text-green-600"
          };
        }
      case "completed":
        if (updatedAt) {
          return {
            icon: <CheckCircle className="h-3 w-3 text-green-500" />,
            text: formatDuration(createdAt, updatedAt),
            color: "text-green-600"
          };
        } else if (readyAt) {
          return {
            icon: <CheckCircle className="h-3 w-3 text-green-500" />,
            text: formatDuration(createdAt, readyAt),
            color: "text-green-600"
          };
        } else {
          return {
            icon: <CheckCircle className="h-3 w-3 text-green-500" />,
            text: "Completed",
            color: "text-green-600"
          };
        }
      case "cancelled":
        return {
          icon: <AlertCircle className="h-3 w-3 text-red-500" />,
          text: "Cancelled",
          color: "text-red-600"
        };
      default:
        return {
          icon: <Clock className="h-3 w-3 text-gray-500" />,
          text: formatDuration(createdAt),
          color: "text-gray-600"
        };
    }
  };

  const timerInfo = getTimerInfo();

  return (
    <div className="flex items-center space-x-1 text-xs">
      {timerInfo.icon}
      <span className={`font-medium ${timerInfo.color}`}>
        {timerInfo.text}
      </span>
    </div>
  );
}
