import { NextRequest, NextResponse } from 'next/server';
import { supabaseDb } from '@/lib/database/supabase';

export async function GET() {
  try {
    const supabase = supabaseDb['client'];
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(`
        *,
        products (*),
        recipe_items (
          *,
          stock_items (*)
        )
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    
    // Transform the data to match frontend expectations
    const transformedRecipes = (recipes || []).map((recipe: any) => ({
      ...recipe,
      items: recipe.recipe_items?.map((item: any) => ({
        id: item.id,
        ingredientId: item.stockItemId, // Map stockItemId to ingredientId for frontend
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes,
        ingredient: item.stock_items ? {
          id: item.stock_items.id,
          name: item.stock_items.name,
          unit: item.stock_items.unit,
          stockQuantity: item.stock_items.stockQuantity,
          minStockLevel: item.stock_items.minStockLevel,
          costPerUnit: item.stock_items.costPerUnit,
        } : undefined
      })) || []
    }));
    
    return NextResponse.json(transformedRecipes);
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, productId, servings, items } = body;

    if (!name || !productId) {
      return NextResponse.json(
        { error: 'Name and product ID are required' },
        { status: 400 }
      );
    }

    const supabase = supabaseDb['client'];
    const { data: recipe, error } = await supabase
      .from('recipes')
      .insert({
        id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        productId: productId,
        servings: servings || 1,
        isActive: true,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // Create recipe items if provided
    if (items && Array.isArray(items) && items.length > 0) {
      const recipeItems = items.map(item => ({
        id: `recipe_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recipeId: recipe.id,
        stockItemId: item.ingredientId, // ingredientId maps to stockItemId
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('recipe_items')
        .insert(recipeItems);

      if (itemsError) {
        console.error('Failed to create recipe items:', itemsError);
      }
    }

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error('Error creating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}
