import sharp from 'sharp';
import { writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

export interface CompressedImageResult {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  filePath: string;
  fileName: string;
}

export interface ImageUploadOptions {
  quality?: number; // 1-100
  maxWidth?: number;
  maxHeight?: number;
  format?: 'jpeg' | 'png' | 'webp';
  outputDir?: string;
}

export class ImageService {
  private static readonly DEFAULT_OPTIONS: Required<ImageUploadOptions> = {
    quality: 80,
    maxWidth: 800,
    maxHeight: 600,
    format: 'jpeg',
    outputDir: 'public/uploads/products' // unused in Supabase path, kept for backward compatibility
  };

  /**
   * Compress and save an image file
   */
  static async compressAndSaveImage(
    imageBuffer: Buffer,
    fileName: string,
    options: Partial<ImageUploadOptions> = {}
  ): Promise<CompressedImageResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Ensure output directory exists
      await this.ensureDirectoryExists(opts.outputDir);
      
      // Generate unique filename
      const uniqueFileName = this.generateUniqueFileName(fileName, opts.format);
      const outputPath = join(opts.outputDir, uniqueFileName);
      
      // Compress image using Sharp
      const compressedBuffer = await sharp(imageBuffer)
        .resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: opts.quality })
        .toBuffer();
      
      // Save compressed image
      await writeFile(outputPath, compressedBuffer);
      
      // Calculate compression stats
      const originalSize = imageBuffer.length;
      const compressedSize = compressedBuffer.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;
      
      return {
        originalSize,
        compressedSize,
        compressionRatio,
        filePath: outputPath,
        fileName: uniqueFileName
      };
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compress image and return Buffer (no filesystem writes)
   */
  static async compressToBuffer(
    imageBuffer: Buffer,
    fileName: string,
    options: Partial<ImageUploadOptions> = {}
  ): Promise<{ compressedBuffer: Buffer; originalSize: number; compressedSize: number; compressionRatio: number; fileName: string }> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    try {
      const uniqueFileName = this.generateUniqueFileName(fileName, opts.format);
      const compressedBuffer = await sharp(imageBuffer)
        .resize(opts.maxWidth, opts.maxHeight, { fit: 'inside', withoutEnlargement: true })
        .toFormat(opts.format, { quality: opts.quality })
        .toBuffer();

      const originalSize = imageBuffer.length;
      const compressedSize = compressedBuffer.length;
      const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

      return { compressedBuffer, originalSize, compressedSize, compressionRatio, fileName: uniqueFileName };
    } catch (error) {
      console.error('Error compressing image to buffer:', error);
      throw new Error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compress image in browser (for client-side compression)
   */
  static async compressImageInBrowser(
    file: File,
    options: Partial<ImageUploadOptions> = {}
  ): Promise<{ compressedFile: File; compressionRatio: number }> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Convert File to Buffer-like object for Sharp
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Compress using Sharp
      const compressedBuffer = await sharp(buffer)
        .resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: opts.quality })
        .toBuffer();
      
      // Create new compressed file
      const compressedFile = new File(
        [new Uint8Array(compressedBuffer)],
        file.name.replace(/\.[^/.]+$/, '') + '_compressed.jpg',
        { type: 'image/jpeg' }
      );
      
      const compressionRatio = ((file.size - compressedFile.size) / file.size) * 100;
      
      return {
        compressedFile,
        compressionRatio
      };
    } catch (error) {
      console.error('Error compressing image in browser:', error);
      throw new Error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a unique filename with timestamp
   */
  private static generateUniqueFileName(originalName: string, format: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = format === 'jpeg' ? 'jpg' : format;
    
    // Remove original extension and add new one
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}_${timestamp}_${randomSuffix}.${extension}`;
  }

  /**
   * Ensure directory exists, create if it doesn't
   */
  private static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await access(dirPath, constants.F_OK);
    } catch {
      await mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Get image dimensions
   */
  static async getImageDimensions(imageBuffer: Buffer): Promise<{ width: number; height: number }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0
      };
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      throw new Error(`Failed to get image dimensions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
      return { isValid: false, error: 'Image size must be less than 10MB' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Only JPEG, PNG, and WebP images are allowed' };
    }
    
    return { isValid: true };
  }

  /**
   * Generate thumbnail for product
   */
  static async generateThumbnail(
    imageBuffer: Buffer,
    fileName: string,
    size: number = 150
  ): Promise<{ thumbnailPath: string; thumbnailName: string }> {
    try {
      const outputDir = 'public/uploads/products/thumbnails';
      await this.ensureDirectoryExists(outputDir);

      const thumbnailName = `thumb_${fileName}`;
      const thumbnailPath = join(outputDir, thumbnailName);

      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 70 })
        .toBuffer();

      await writeFile(thumbnailPath, thumbnailBuffer);

      return {
        thumbnailPath,
        thumbnailName
      };
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate thumbnail and return Buffer (no filesystem writes)
   */
  static async generateThumbnailBuffer(
    imageBuffer: Buffer,
    fileName: string,
    size: number = 150
  ): Promise<{ thumbnailBuffer: Buffer; thumbnailName: string }> {
    try {
      const thumbnailName = `thumb_${fileName}`;
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 70 })
        .toBuffer();

      return { thumbnailBuffer, thumbnailName };
    } catch (error) {
      console.error('Error generating thumbnail buffer:', error);
      throw new Error(`Failed to generate thumbnail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default ImageService;
