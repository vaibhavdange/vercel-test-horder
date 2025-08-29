import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { sampleCategories, sampleMenuItems, sampleInventoryItems } from '@/lib/data/sampleMenuData';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Insert categories
    console.log('Inserting categories...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .insert(sampleCategories)
      .select();

    if (categoriesError) {
      console.error('Error inserting categories:', categoriesError);
      return NextResponse.json({ error: 'Failed to insert categories' }, { status: 500 });
    }

    console.log(`Inserted ${categoriesData?.length} categories`);

    // Insert menu items
    console.log('Inserting menu items...');
    const { data: menuData, error: menuError } = await supabase
      .from('products')
      .insert(sampleMenuItems.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category_id: item.categoryId,
        image_url: item.image,
        is_available: item.isAvailable,
        is_vegetarian: item.isVegetarian,
        spice_level: item.spiceLevel,
        preparation_time: item.preparationTime,
        allergens: item.allergens,
        nutritional_info: item.nutritionalInfo
      })))
      .select();

    if (menuError) {
      console.error('Error inserting menu items:', menuError);
      return NextResponse.json({ error: 'Failed to insert menu items' }, { status: 500 });
    }

    console.log(`Inserted ${menuData?.length} menu items`);

    // Insert inventory items
    console.log('Inserting inventory items...');
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('stock_items')
      .insert(sampleInventoryItems.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        current_stock: item.currentStock,
        min_stock_level: item.minStockLevel,
        cost_per_unit: item.costPerUnit,
        supplier: item.supplier,
        is_active: item.isActive,
        expiry_date: item.expiryDate
      })))
      .select();

    if (inventoryError) {
      console.error('Error inserting inventory items:', inventoryError);
      return NextResponse.json({ error: 'Failed to insert inventory items' }, { status: 500 });
    }

    console.log(`Inserted ${inventoryData?.length} inventory items`);

    return NextResponse.json({
      success: true,
      message: 'Sample data populated successfully',
      summary: {
        categories: categoriesData?.length || 0,
        menuItems: menuData?.length || 0,
        inventoryItems: inventoryData?.length || 0
      }
    });

  } catch (error) {
    console.error('Error populating sample data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
