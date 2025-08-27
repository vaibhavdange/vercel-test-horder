import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select(`
        *,
        products (*),
        recipe_items (
          *,
          ingredients (*)
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !recipe) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, servings, items } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: recipe, error } = await supabase
      .from('recipes')
      .update({
        name,
        description,
        servings: servings || 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) throw error;

    // Update recipe items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await supabase
        .from('recipe_items')
        .delete()
        .eq('recipe_id', params.id);

      // Create new items
      if (items.length > 0) {
        const recipeItems = items.map(item => ({
          recipe_id: params.id,
          ingredient_id: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
        }));

        const { error: itemsError } = await supabase
          .from('recipe_items')
          .insert(recipeItems);

        if (itemsError) {
          console.error('Failed to update recipe items:', itemsError);
        }
      }
    }

    return NextResponse.json(recipe);
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = supabaseDb['client'];
    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', params.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}
