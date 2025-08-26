"use client";

import { useEffect, useState, useRef } from 'react';

interface AnimatedProgressBarProps {
  value: number;
  maxValue: number;
  height?: number;
  color?: 'green' | 'blue' | 'purple' | 'yellow' | 'red' | 'indigo';
  showPercentage?: boolean;
  className?: string;
}

export default function AnimatedProgressBar({
  value,
  maxValue,
  height = 8,
  color = 'green',
  showPercentage = false,
  className = ''
}: AnimatedProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevProgressRef = useRef<number | undefined>(undefined);
  const animationRef = useRef<number>();

  const safeMax = !maxValue || !isFinite(maxValue) || maxValue <= 0 ? 1 : maxValue;
  const target = Math.max(0, Math.min(1, value / safeMax));

  const getColorClasses = () => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'purple': return 'bg-purple-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      case 'indigo': return 'bg-indigo-500';
      default: return 'bg-green-500';
    }
  };

  const getBackgroundColor = () => {
    switch (color) {
      case 'green': return 'bg-green-100';
      case 'blue': return 'bg-blue-100';
      case 'purple': return 'bg-purple-100';
      case 'yellow': return 'bg-yellow-100';
      case 'red': return 'bg-red-100';
      case 'indigo': return 'bg-indigo-100';
      default: return 'bg-green-100';
    }
  };

  useEffect(() => {
    const start = prevProgressRef.current ?? 0; // from 0 on first mount
    const end = target;

    if (Math.abs(end - start) < 0.002) {
      setProgress(end);
      prevProgressRef.current = end;
      return;
    }

    setIsAnimating(true);
    const startTime = performance.now();
    const duration = 3000; // Updated to match counter animations

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Use the same faster easing function as AnimatedCounter
      const ease = t < 0.3 
        ? t * 2.5  // Quick start (0-30%)
        : t < 0.7 
          ? 0.75 + (t - 0.3) * 0.625  // Fast middle (30-70%)
          : 0.875 + (t - 0.7) * 0.417; // Smooth finish (70-100%)
      
      const current = start + (end - start) * ease;
      setProgress(current);

      if (t < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setProgress(end);
        setIsAnimating(false);
        prevProgressRef.current = end;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [target]);

  const percentage = Math.round(progress * 100);
  const width = `${Math.min(Math.max(progress * 100, 0), 100)}%`;

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full rounded-full ${getBackgroundColor()}`} style={{ height: `${height}px` }}>
        <div
          className={`h-full rounded-full transition-[width] duration-300 ease-out ${getColorClasses()} ${isAnimating ? 'shadow-lg' : ''}`}
          style={{ width }}
        />
      </div>
      {showPercentage && (
        <div className="text-xs text-gray-600 mt-1 text-right">{percentage}%</div>
      )}
    </div>
  );
}
