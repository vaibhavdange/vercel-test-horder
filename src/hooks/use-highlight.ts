"use client";

import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

export function useHighlight() {
  const searchParams = useSearchParams();
  const highlightRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Check if there's a hash in the URL
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash) {
        // Remove the # symbol
        const id = hash.substring(1);
        
        // Wait for the page to fully render
        const timer = setTimeout(() => {
          const element = document.getElementById(id);
          if (element) {
            // Scroll to the element
            element.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            
            // Add enhanced highlight effect
            element.classList.add(
              'ring-4', 
              'ring-green-500', 
              'ring-offset-4', 
              'bg-green-50', 
              'shadow-lg',
              'scale-105',
              'transition-all',
              'duration-500'
            );
            
            // Add a subtle pulse animation
            element.style.animation = 'pulse 2s ease-in-out';
            
            // Remove highlight after 4 seconds
            setTimeout(() => {
              element.classList.remove(
                'ring-4', 
                'ring-green-500', 
                'ring-offset-4', 
                'bg-green-50', 
                'shadow-lg',
                'scale-105'
              );
              element.style.animation = '';
            }, 4000);
            
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 500);
        
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams]);

  return { highlightRef };
}
