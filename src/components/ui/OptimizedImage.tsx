"use client";

import { useState } from 'react';
import Image from 'next/image';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackIcon?: React.ReactNode;
  priority?: boolean;
  quality?: number;
  fill?: boolean;
  sizes?: string;
}

export function OptimizedImage({
  src,
  alt,
  width = 150,
  height = 150,
  className = '',
  fallbackIcon,
  priority = false,
  quality = 80,
  fill = false,
  sizes
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // If no image source, show fallback
  if (!src) {
    return (
      <div
        className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
        style={fill ? undefined : { width, height }}
      >
        {fallbackIcon || <ImageIcon className="h-8 w-8 text-gray-400" />}
      </div>
    );
  }

  // Check if it's a local image or external URL
  const isLocalImage = src.startsWith('/uploads/');
  const isExternalImage = src.startsWith('http');
  const isRelativePath = src.startsWith('/') && !isLocalImage;

  // Handle image load success
  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  // Handle image load error
  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  // If it's a local image, use Next.js Image component for optimization
  if (isLocalImage) {
    return (
      <div className={`relative ${className}`} style={fill ? undefined : { width, height }}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        )}

        {fill ? (
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            className={`rounded-lg object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority={priority}
            quality={quality}
          />
        ) : (
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            className={`rounded-lg object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            priority={priority}
            quality={quality}
          />
        )}

        {imageError && (
          <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
            {fallbackIcon || <ImageIcon className="h-8 w-8 text-gray-400" />}
          </div>
        )}
      </div>
    );
  }

  // If it's an external image, use regular img tag with error handling
  if (isExternalImage) {
    return (
      <div className={`relative ${className}`} style={fill ? undefined : { width, height }}>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        )}

        <img
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          className={`rounded-lg object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200 ${fill ? 'w-full h-full' : ''}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {imageError && (
          <div className="absolute inset-0 bg-gray-200 rounded-lg flex items-center justify-center">
            {fallbackIcon || <ImageIcon className="h-8 w-8 text-gray-400" />}
          </div>
        )}
      </div>
    );
  }

  // If it's a relative path that might not exist, show fallback immediately
  if (isRelativePath) {
    return (
      <div
        className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
        style={fill ? undefined : { width, height }}
      >
        {fallbackIcon || <ImageIcon className="h-8 w-8 text-gray-400" />}
      </div>
    );
  }

  // Fallback for invalid image sources
  return (
    <div
      className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}
      style={fill ? undefined : { width, height }}
    >
      {fallbackIcon || <ImageIcon className="h-8 w-8 text-gray-400" />}
    </div>
  );
}

export default OptimizedImage;
