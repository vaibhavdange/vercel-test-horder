"use client"

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthLevel {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, className }) => {
  const [strength, setStrength] = useState<StrengthLevel>({
    score: 0,
    label: '',
    color: '',
    bgColor: ''
  });

  const calculateStrength = (password: string): StrengthLevel => {
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Calculate score
    Object.values(checks).forEach(check => {
      if (check) score++;
    });

    // Additional length bonus
    if (password.length >= 12) score += 0.5;
    if (password.length >= 16) score += 0.5;

    // Determine strength level
    if (score < 2) {
      return {
        score: 1,
        label: 'Very Weak',
        color: 'text-red-600',
        bgColor: 'bg-red-500'
      };
    } else if (score < 3) {
      return {
        score: 2,
        label: 'Weak',
        color: 'text-orange-600',
        bgColor: 'bg-orange-500'
      };
    } else if (score < 4) {
      return {
        score: 3,
        label: 'Fair',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500'
      };
    } else if (score < 5) {
      return {
        score: 4,
        label: 'Good',
        color: 'text-blue-600',
        bgColor: 'bg-blue-500'
      };
    } else {
      return {
        score: 5,
        label: 'Strong',
        color: 'text-green-600',
        bgColor: 'bg-green-500'
      };
    }
  };

  useEffect(() => {
    if (password) {
      setStrength(calculateStrength(password));
    } else {
      setStrength({
        score: 0,
        label: '',
        color: '',
        bgColor: ''
      });
    }
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Password Strength</span>
        <span className={cn("font-medium", strength.color)}>
          {strength.label}
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            strength.bgColor
          )}
          style={{ width: `${(strength.score / 5) * 100}%` }}
        />
      </div>
      
      <div className="text-xs text-gray-500 space-y-1">
        <div className="flex items-center space-x-4">
          <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
            ✓ At least 8 characters
          </span>
          <span className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
            ✓ Lowercase letter
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
            ✓ Uppercase letter
          </span>
          <span className={/\d/.test(password) ? 'text-green-600' : 'text-gray-400'}>
            ✓ Number
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
            ✓ Special character
          </span>
        </div>
      </div>
    </div>
  );
};

export default PasswordStrength;
