"use client";

import { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  formatAsCurrency?: boolean;
}

export default function AnimatedCounter({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  formatAsCurrency = false
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevValueRef = useRef<number>(0); // Store the previous value
  const animationRef = useRef<number>();

  useEffect(() => {
    // Start from the previous value (or 0 if first time)
    const startValue = prevValueRef.current;
    const endValue = value;

    // Avoid micro-animations for extremely small diffs
    const snapThreshold = decimals > 0 ? 0.01 : 1;
    if (Math.abs(endValue - startValue) < snapThreshold) {
      setDisplayValue(endValue);
      prevValueRef.current = endValue;
      return;
    }

    setIsAnimating(true);
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Use linear animation for numbers (no easing)
      const easeProgress = progress;
      
      // Animate from previous value to new value
      const currentValue = startValue + (endValue - startValue) * easeProgress;
      
      // Add safeguard against floating-point errors
      const safeValue = Math.max(0, currentValue); // Never go below 0
      setDisplayValue(safeValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        setIsAnimating(false);
        prevValueRef.current = endValue; // Store the new value for next animation
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [value, duration, decimals]);

  const formatValue = (val: number) => {
    if (formatAsCurrency) {
      return new Intl.NumberFormat('en-IN', { 
        style: 'currency', 
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    if (decimals === 0) return Math.round(val).toLocaleString();
    return val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  return (
    <span className={`transition-all duration-300 ${isAnimating ? 'scale-105' : 'scale-100'} ${className}`}>
      {prefix}{formatValue(displayValue)}{suffix}
    </span>
  );
}