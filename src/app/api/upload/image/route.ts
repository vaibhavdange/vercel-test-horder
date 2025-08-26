import { NextRequest, NextResponse } from 'next/server';
import ImageService from '@/lib/services/image-service';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const maxDuration = 20; // limit heavy image work

export async function POST(request: NextRequest) {
  try {
    // Enforce content type and size via edge headers is not reliable; validate here
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 });
    }

    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    
    if (!imageFile) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate image file
    const validation = ImageService.validateImageFile(imageFile);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compress image in-memory
    const { compressedBuffer, originalSize, compressedSize, compressionRatio, fileName } = await ImageService.compressToBuffer(buffer, imageFile.name, {
      quality: 80,
      maxWidth: 800,
      maxHeight: 600,
      format: 'jpeg'
    });

    // Generate thumbnail in-memory
    const { thumbnailBuffer, thumbnailName } = await ImageService.generateThumbnailBuffer(buffer, fileName);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE as string | undefined;
    const bucket = process.env.SUPABASE_BUCKET_PRODUCTS || 'products';
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Storage not configured' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Upload main image
    const mainPath = `${fileName}`;
    const { error: upErr } = await supabase.storage.from(bucket).upload(mainPath, compressedBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (upErr) {
      return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
    }

    // Upload thumbnail
    const thumbPath = `thumbnails/${thumbnailName}`;
    const { error: thErr } = await supabase.storage.from(bucket).upload(thumbPath, thumbnailBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });
    if (thErr) {
      return NextResponse.json({ error: `Thumbnail upload failed: ${thErr.message}` }, { status: 500 });
    }

    const { data: pubMain } = supabase.storage.from(bucket).getPublicUrl(mainPath);
    const { data: pubThumb } = supabase.storage.from(bucket).getPublicUrl(thumbPath);

    return NextResponse.json({
      success: true,
      message: 'Image uploaded and compressed successfully',
      data: {
        originalSize,
        compressedSize,
        compressionRatio,
        imageUrl: pubMain.publicUrl,
        thumbnailUrl: pubThumb.publicUrl,
        fileName
      }
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { 
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Image upload endpoint - use POST method' },
    { status: 200 }
  );
}
