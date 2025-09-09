"use client";

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Card } from './card';
import { supabase } from '@/lib/supabase/client';

interface ImageUploadProps {
  onImageUpload: (imageUrl: string, thumbnailUrl: string) => void;
  currentImage?: string;
  className?: string;
  disabled?: boolean;
}

interface UploadResult {
  imageUrl: string;
  thumbnailUrl: string;
  fileName: string;
  compressionRatio: number;
  originalSize: number;
  compressedSize: number;
}

export function ImageUpload({ onImageUpload, currentImage, className = '', disabled = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    if (disabled) return;

    setError(null);
    setIsUploading(true);

    try {
      // Optional: Validate file type/size here
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const filePath = `images/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message || 'Upload failed');
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(filePath);
      const imageUrl = publicUrlData?.publicUrl;

      if (!imageUrl) {
        throw new Error('Failed to get public URL');
      }

      // No thumbnail or compression in this direct upload version
      const uploadData: UploadResult = {
        imageUrl,
        thumbnailUrl: imageUrl, // Use same image for thumbnail for now
        fileName,
        compressionRatio: 0,
        originalSize: file.size,
        compressedSize: file.size,
      };

      setUploadResult(uploadData);
      onImageUpload(uploadData.imageUrl, uploadData.thumbnailUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  }, [onImageUpload, disabled]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }, [handleFileUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  }, [handleFileUpload]);

  const handleRemoveImage = useCallback(() => {
    setUploadResult(null);
    onImageUpload('', '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onImageUpload]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Image Display */}
      {currentImage && !uploadResult && (
        <div className="relative">
          <img
            src={currentImage}
            alt="Current product image"
            className="w-32 h-32 object-cover rounded-lg border border-gray-200"
          />
          <button
            onClick={handleRemoveImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Upload Result Display */}
      {uploadResult && (
        <Card className="p-4 border-green-200 bg-green-50">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-green-900">Image uploaded successfully!</h4>
              <div className="mt-2 space-y-1 text-sm text-green-700">
                <p>File: {uploadResult.fileName}</p>
                <p>Compression: {uploadResult.compressionRatio.toFixed(1)}% smaller</p>
                <p>Size: {formatFileSize(uploadResult.compressedSize)} (was {formatFileSize(uploadResult.originalSize)})</p>
              </div>
            </div>
            <button
              onClick={handleRemoveImage}
              className="text-green-600 hover:text-green-800"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-red-900">Upload failed</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Upload Area */}
      {!uploadResult && !currentImage && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? 'border-green-400 bg-green-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="space-y-3">
            <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              {isUploading ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              ) : (
                <Upload className="h-6 w-6 text-gray-400" />
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, WebP up to 10MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Button (when there's a current image) */}
      {currentImage && !uploadResult && (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          Replace Image
        </Button>
      )}

      {/* Hidden file input for button clicks */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
