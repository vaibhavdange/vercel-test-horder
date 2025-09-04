"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
  className?: string;
}

export default function LoadingSpinner({ size = "md", message = "Loading...", className = "" }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <div className="text-center">
        <div className={`animate-spin rounded-full border-b-2 border-green-600 mx-auto mb-4 ${sizeClasses[size]}`}></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
