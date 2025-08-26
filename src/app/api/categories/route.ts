import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Check if we can connect to Supabase
    console.log('Categories API: Starting request');
    console.log('Supabase URL available:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Service Role available:', !!process.env.SUPABASE_SERVICE_ROLE);
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    console.log('Categories API: About to query Supabase');
    const supabase = createServerSupabaseClient();
    
    let query = supabase
      .from('categories')
      .select('*')
      .eq('isActive', true);
    
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    const { data: categories, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json(categories || []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch categories',
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, icon, parentId } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    
    const { data: category, error } = await supabase
      .from('categories')
      .insert({
        name,
        description,
        icon: icon || '🍴',
        parentId,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}
