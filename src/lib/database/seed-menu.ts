import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMenu() {
  try {
    console.log('🍽️ Starting menu seeding...');

    // Create tax categories
    console.log('💰 Creating tax categories...');
    const taxCategories = [
      { name: 'Food', description: 'Standard food items', taxRate: 0.08 },
      { name: 'Beverages', description: 'Non-alcoholic drinks', taxRate: 0.10 },
      { name: 'Alcohol', description: 'Alcoholic beverages', taxRate: 0.15 },
      { name: 'Desserts', description: 'Sweet treats and desserts', taxRate: 0.08 },
      { name: 'Premium', description: 'Premium items with higher tax', taxRate: 0.12 }
    ];

    const createdTaxCategories = [];
    for (const taxData of taxCategories) {
      const taxCategory = await prisma.taxCategory.create({
        data: taxData
      });
      createdTaxCategories.push(taxCategory);
      console.log(`✅ Created tax category: ${taxCategory.name} (${taxCategory.taxRate * 100}%)`);
    }

    // Create ingredient categories
    console.log('📦 Creating ingredient categories...');
    const ingredientCategories = [
      { name: 'Produce', description: 'Fresh fruits and vegetables', icon: '🥬' },
      { name: 'Dairy', description: 'Milk, cheese, and dairy products', icon: '🥛' },
      { name: 'Meat', description: 'Fresh meat and poultry', icon: '🥩' },
      { name: 'Pantry', description: 'Dry goods and staples', icon: '🫘' },
      { name: 'Spices', description: 'Herbs and seasonings', icon: '🌶️' },
      { name: 'Beverages', description: 'Drink ingredients', icon: '🥤' }
    ];

    const createdIngredientCategories = [];
    for (const catData of ingredientCategories) {
      const category = await prisma.category.create({
        data: catData
      });
      createdIngredientCategories.push(category);
      console.log(`✅ Created ingredient category: ${category.icon} ${category.name}`);
    }

    // Create menu categories
    console.log('🍽️ Creating menu categories...');
    const menuCategories = [
      { name: 'Appetizers', description: 'Starters and small plates', icon: '🥗' },
      { name: 'Main Course', description: 'Primary dishes and entrees', icon: '🍽️' },
      { name: 'Pizza', description: 'Italian pizza varieties', icon: '🍕' },
      { name: 'Pasta', description: 'Italian pasta dishes', icon: '🍝' },
      { name: 'Burgers', description: 'Gourmet burgers and sandwiches', icon: '🍔' },
      { name: 'Seafood', description: 'Fresh seafood dishes', icon: '🦐' },
      { name: 'Desserts', description: 'Sweet treats and cakes', icon: '🍰' },
      { name: 'Beverages', description: 'Drinks and refreshments', icon: '🥤' },
      { name: 'Coffee & Tea', description: 'Hot and cold coffee/tea', icon: '☕' }
    ];

    const createdMenuCategories = [];
    for (const catData of menuCategories) {
      const category = await prisma.category.create({
        data: catData
      });
      createdMenuCategories.push(category);
      console.log(`✅ Created menu category: ${category.icon} ${category.name}`);
    }

    // Create ingredients with inventory
    console.log('🥕 Creating ingredients and inventory...');
    const ingredients = [
      // Produce
      {
        name: 'Fresh Tomatoes',
        description: 'Ripe Roma tomatoes',
        unit: 'kg',
        costPerUnit: 2.50,
        stockQuantity: 15.0,
        minStockLevel: 5.0,
        supplier: 'Fresh Farms Co.',
        location: 'Walk-in Refrigerator',
        categoryId: createdIngredientCategories.find(c => c.name === 'Produce')?.id
      },
      {
        name: 'Fresh Basil',
        description: 'Organic basil leaves',
        unit: 'bunches',
        costPerUnit: 1.20,
        stockQuantity: 20.0,
        minStockLevel: 8.0,
        supplier: 'Herb Garden Ltd.',
        location: 'Walk-in Refrigerator',
        categoryId: createdIngredientCategories.find(c => c.name === 'Produce')?.id
      },
      {
        name: 'Mozzarella Cheese',
        description: 'Fresh mozzarella balls',
        unit: 'kg',
        costPerUnit: 8.50,
        stockQuantity: 12.0,
        minStockLevel: 4.0,
        supplier: 'Dairy Delights',
        location: 'Walk-in Refrigerator',
        categoryId: createdIngredientCategories.find(c => c.name === 'Dairy')?.id
      },
      {
        name: 'Pizza Dough',
        description: 'Pre-made pizza dough',
        unit: 'pieces',
        costPerUnit: 1.80,
        stockQuantity: 50.0,
        minStockLevel: 15.0,
        supplier: 'Bakery Supplies Inc.',
        location: 'Freezer',
        categoryId: createdIngredientCategories.find(c => c.name === 'Pantry')?.id
      },
      {
        name: 'Ground Beef',
        description: 'Premium ground beef 80/20',
        unit: 'kg',
        costPerUnit: 12.00,
        stockQuantity: 25.0,
        minStockLevel: 8.0,
        supplier: 'Prime Meats Co.',
        location: 'Walk-in Refrigerator',
        categoryId: createdIngredientCategories.find(c => c.name === 'Meat')?.id
      },
      {
        name: 'Chicken Breast',
        description: 'Boneless skinless chicken breast',
        unit: 'kg',
        costPerUnit: 9.50,
        stockQuantity: 20.0,
        minStockLevel: 6.0,
        supplier: 'Poultry Plus',
        location: 'Walk-in Refrigerator',
        categoryId: createdIngredientCategories.find(c => c.name === 'Meat')?.id
      },
      {
        name: 'Spaghetti',
        description: 'Premium durum wheat spaghetti',
        unit: 'kg',
        costPerUnit: 3.20,
        stockQuantity: 30.0,
        minStockLevel: 10.0,
        supplier: 'Pasta Perfect',
        location: 'Dry Storage',
        categoryId: createdIngredientCategories.find(c => c.name === 'Pantry')?.id
      },
      {
        name: 'Olive Oil',
        description: 'Extra virgin olive oil',
        unit: 'liters',
        costPerUnit: 15.00,
        stockQuantity: 8.0,
        minStockLevel: 2.0,
        supplier: 'Mediterranean Imports',
        location: 'Dry Storage',
        categoryId: createdIngredientCategories.find(c => c.name === 'Pantry')?.id
      },
      {
        name: 'Garlic',
        description: 'Fresh garlic bulbs',
        unit: 'kg',
        costPerUnit: 4.00,
        stockQuantity: 10.0,
        minStockLevel: 3.0,
        supplier: 'Fresh Farms Co.',
        location: 'Walk-in Refrigerator',
        categoryId: createdIngredientCategories.find(c => c.name === 'Produce')?.id
      },
      {
        name: 'Onions',
        description: 'Yellow cooking onions',
        unit: 'kg',
        costPerUnit: 1.50,
        stockQuantity: 20.0,
        minStockLevel: 5.0,
        supplier: 'Fresh Farms Co.',
        location: 'Walk-in Refrigerator',
        categoryId: createdIngredientCategories.find(c => c.name === 'Produce')?.id
      },
      {
        name: 'Flour',
        description: 'All-purpose flour',
        unit: 'kg',
        costPerUnit: 2.00,
        stockQuantity: 25.0,
        minStockLevel: 8.0,
        supplier: 'Bakery Supplies Inc.',
        location: 'Dry Storage',
        categoryId: createdIngredientCategories.find(c => c.name === 'Pantry')?.id
      },
      {
        name: 'Eggs',
        description: 'Large fresh eggs',
        unit: 'dozen',
        costPerUnit: 3.50,
        stockQuantity: 15.0,
        minStockLevel: 5.0,
        supplier: 'Farm Fresh Eggs',
        location: 'Walk-in Refrigerator',
        categoryId: createdIngredientCategories.find(c => c.name === 'Dairy')?.id
      },
      {
        name: 'Milk',
        description: 'Whole milk',
        unit: 'liters',
        costPerUnit: 2.20,
        stockQuantity: 20.0,
        minStockLevel: 6.0,
        supplier: 'Dairy Delights',
        location: 'Walk-in Refrigerator',
        categoryId: createdIngredientCategories.find(c => c.name === 'Dairy')?.id
      },
      {
        name: 'Sugar',
        description: 'Granulated white sugar',
        unit: 'kg',
        costPerUnit: 1.80,
        stockQuantity: 15.0,
        minStockLevel: 5.0,
        supplier: 'Sweet Supplies',
        location: 'Dry Storage',
        categoryId: createdIngredientCategories.find(c => c.name === 'Pantry')?.id
      },
      {
        name: 'Coffee Beans',
        description: 'Premium Arabica coffee beans',
        unit: 'kg',
        costPerUnit: 18.00,
        stockQuantity: 12.0,
        minStockLevel: 4.0,
        supplier: 'Coffee Roasters Co.',
        location: 'Dry Storage',
        categoryId: createdIngredientCategories.find(c => c.name === 'Beverages')?.id
      },
      {
        name: 'Tea Leaves',
        description: 'Assorted tea varieties',
        unit: 'kg',
        costPerUnit: 25.00,
        stockQuantity: 8.0,
        minStockLevel: 3.0,
        supplier: 'Tea Traders',
        location: 'Dry Storage',
        categoryId: createdIngredientCategories.find(c => c.name === 'Beverages')?.id
      }
    ];

    const createdStockItems = [];
    for (const stockItemData of ingredients) {
      const stockItem = await prisma.stockItem.create({
        data: stockItemData
      });
      createdStockItems.push(stockItem);
      console.log(`✅ Created stock item: ${stockItem.name} - ${stockItem.stockQuantity} ${stockItem.unit}`);
    }

    // Create products (menu items)
    console.log('🍕 Creating menu products...');
    const products = [
      {
        name: 'Margherita Pizza',
        description: 'Classic tomato, mozzarella, and basil pizza',
        price: 18.99,
        cost: 8.50,
        stockQuantity: 25,
        minStockLevel: 5,
        categoryId: createdMenuCategories.find(c => c.name === 'Pizza')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Food')?.id,
        barcode: 'PIZ001',
        image: '/images/margherita-pizza.jpg'
      },
      {
        name: 'Pepperoni Pizza',
        description: 'Spicy pepperoni with mozzarella cheese',
        price: 21.99,
        cost: 10.20,
        stockQuantity: 20,
        minStockLevel: 5,
        categoryId: createdMenuCategories.find(c => c.name === 'Pizza')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Food')?.id,
        barcode: 'PIZ002',
        image: '/images/pepperoni-pizza.jpg'
      },
      {
        name: 'Classic Cheeseburger',
        description: 'Beef patty with cheese, lettuce, and tomato',
        price: 14.99,
        cost: 6.50,
        stockQuantity: 30,
        minStockLevel: 8,
        categoryId: createdMenuCategories.find(c => c.name === 'Burgers')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Food')?.id,
        barcode: 'BUR001',
        image: '/images/cheeseburger.jpg'
      },
      {
        name: 'Chicken Caesar Salad',
        description: 'Fresh romaine lettuce with grilled chicken and Caesar dressing',
        price: 16.99,
        cost: 7.80,
        stockQuantity: 20,
        minStockLevel: 5,
        categoryId: createdMenuCategories.find(c => c.name === 'Appetizers')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Food')?.id,
        barcode: 'SAL001',
        image: '/images/caesar-salad.jpg'
      },
      {
        name: 'Spaghetti Carbonara',
        description: 'Pasta with eggs, cheese, pancetta, and black pepper',
        price: 19.99,
        cost: 9.20,
        stockQuantity: 18,
        minStockLevel: 5,
        categoryId: createdMenuCategories.find(c => c.name === 'Pasta')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Food')?.id,
        barcode: 'PAS001',
        image: '/images/carbonara.jpg'
      },
      {
        name: 'Grilled Salmon',
        description: 'Fresh Atlantic salmon with herbs and lemon',
        price: 28.99,
        cost: 15.50,
        stockQuantity: 15,
        minStockLevel: 4,
        categoryId: createdMenuCategories.find(c => c.name === 'Seafood')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Premium')?.id,
        barcode: 'SEA001',
        image: '/images/grilled-salmon.jpg'
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with molten center',
        price: 9.99,
        cost: 4.20,
        stockQuantity: 20,
        minStockLevel: 5,
        categoryId: createdMenuCategories.find(c => c.name === 'Desserts')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Desserts')?.id,
        barcode: 'DES001',
        image: '/images/lava-cake.jpg'
      },
      {
        name: 'Fresh Fruit Smoothie',
        description: 'Blend of seasonal fruits with yogurt',
        price: 7.99,
        cost: 3.50,
        stockQuantity: 25,
        minStockLevel: 8,
        categoryId: createdMenuCategories.find(c => c.name === 'Beverages')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Beverages')?.id,
        barcode: 'BEV001',
        image: '/images/fruit-smoothie.jpg'
      },
      {
        name: 'Espresso',
        description: 'Single shot of premium espresso',
        price: 3.99,
        cost: 1.20,
        stockQuantity: 50,
        minStockLevel: 15,
        categoryId: createdMenuCategories.find(c => c.name === 'Coffee & Tea')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Beverages')?.id,
        barcode: 'COF001',
        image: '/images/espresso.jpg'
      },
      {
        name: 'Craft Beer',
        description: 'Local craft beer selection',
        price: 8.99,
        cost: 4.50,
        stockQuantity: 40,
        minStockLevel: 10,
        categoryId: createdMenuCategories.find(c => c.name === 'Beverages')?.id,
        taxCategoryId: createdTaxCategories.find(t => t.name === 'Alcohol')?.id,
        barcode: 'BEV002',
        image: '/images/craft-beer.jpg'
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const product = await prisma.product.create({
        data: productData
      });
      createdProducts.push(product);
      console.log(`✅ Created product: ${product.name} - $${product.price}`);
    }

    // Create recipes
    console.log('📖 Creating recipes...');
    const recipes = [
      {
        name: 'Margherita Pizza Recipe',
        description: 'Traditional Margherita pizza with fresh ingredients',
        productId: createdProducts.find(p => p.name === 'Margherita Pizza')?.id || '',
        servings: 1,
        items: [
          {
            stockItemId: createdStockItems.find(i => i.name === 'Pizza Dough')?.id || '',
            quantity: 1,
            unit: 'piece',
            notes: 'Room temperature'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Fresh Tomatoes')?.id || '',
            quantity: 0.2,
            unit: 'kg',
            notes: 'Sliced thin'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Mozzarella Cheese')?.id || '',
            quantity: 0.15,
            unit: 'kg',
            notes: 'Shredded'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Fresh Basil')?.id || '',
            quantity: 0.02,
            unit: 'kg',
            notes: 'Fresh leaves'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Olive Oil')?.id || '',
            quantity: 0.02,
            unit: 'liters',
            notes: 'Extra virgin'
          }
        ]
      },
      {
        name: 'Classic Cheeseburger Recipe',
        description: 'Juicy beef burger with classic toppings',
        productId: createdProducts.find(p => p.name === 'Classic Cheeseburger')?.id || '',
        servings: 1,
        items: [
          {
            stockItemId: createdStockItems.find(i => i.name === 'Ground Beef')?.id || '',
            quantity: 0.15,
            unit: 'kg',
            notes: 'Formed into patty'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Mozzarella Cheese')?.id || '',
            quantity: 0.03,
            unit: 'kg',
            notes: 'Slice for melting'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Fresh Tomatoes')?.id || '',
            quantity: 0.05,
            unit: 'kg',
            notes: 'Sliced'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Onions')?.id || '',
            quantity: 0.03,
            unit: 'kg',
            notes: 'Sliced'
          }
        ]
      },
      {
        name: 'Spaghetti Carbonara Recipe',
        description: 'Traditional Italian carbonara pasta',
        productId: createdProducts.find(p => p.name === 'Spaghetti Carbonara')?.id || '',
        servings: 1,
        items: [
          {
            stockItemId: createdStockItems.find(i => i.name === 'Spaghetti')?.id || '',
            quantity: 0.2,
            unit: 'kg',
            notes: 'Al dente'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Eggs')?.id || '',
            quantity: 2,
            unit: 'pieces',
            notes: 'Room temperature'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Mozzarella Cheese')?.id || '',
            quantity: 0.08,
            unit: 'kg',
            notes: 'Grated'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Garlic')?.id || '',
            quantity: 0.02,
            unit: 'kg',
            notes: 'Minced'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Olive Oil')?.id || '',
            quantity: 0.02,
            unit: 'liters',
            notes: 'For cooking'
          }
        ]
      },
      {
        name: 'Chocolate Lava Cake Recipe',
        description: 'Decadent chocolate cake with molten center',
        productId: createdProducts.find(p => p.name === 'Chocolate Lava Cake')?.id || '',
        servings: 1,
        items: [
          {
            stockItemId: createdStockItems.find(i => i.name === 'Flour')?.id || '',
            quantity: 0.08,
            unit: 'kg',
            notes: 'Sifted'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Sugar')?.id || '',
            quantity: 0.1,
            unit: 'kg',
            notes: 'Granulated'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Eggs')?.id || '',
            quantity: 2,
            unit: 'pieces',
            notes: 'Room temperature'
          },
          {
            stockItemId: createdStockItems.find(i => i.name === 'Milk')?.id || '',
            quantity: 0.1,
            unit: 'liters',
            notes: 'Warm'
          }
        ]
      }
    ];

    for (const recipeData of recipes) {
      if (recipeData.productId) {
        const recipe = await prisma.recipe.create({
          data: {
            name: recipeData.name,
            description: recipeData.description,
            productId: recipeData.productId,
            servings: recipeData.servings
          }
        });

        // Create recipe items
        for (const itemData of recipeData.items) {
          if (itemData.stockItemId) {
            await prisma.recipeItem.create({
              data: {
                recipeId: recipe.id,
                stockItemId: itemData.stockItemId,
                quantity: itemData.quantity,
                unit: itemData.unit,
                notes: itemData.notes
              }
            });
          }
        }

        console.log(`✅ Created recipe: ${recipe.name} with ${recipeData.items.length} ingredients`);
      }
    }

    // Create a sample user for testing
    console.log('👤 Creating sample user...');
    const user = await prisma.user.create({
      data: {
        username: 'admin',
        passwordHash: 'hashed_password_here', // In production, use proper hashing
        fullName: 'System Administrator',
        email: 'admin@horder-pos.com',
        role: 'admin',
        isActive: true
      }
    });
    console.log(`✅ Created user: ${user.fullName}`);

    console.log('🎉 Menu seeding completed successfully!');
    
    // Display summary
    const totalProducts = await prisma.product.count();
    const totalIngredients = await prisma.stockItem.count();
    const totalRecipes = await prisma.recipe.count();
    const totalCategories = await prisma.category.count();
    
    console.log(`📊 Summary:`);
    console.log(`   - Total Products: ${totalProducts}`);
    console.log(`   - Total Ingredients: ${totalIngredients}`);
    console.log(`   - Total Recipes: ${totalRecipes}`);
    console.log(`   - Total Categories: ${totalCategories}`);

  } catch (error) {
    console.error('❌ Error during menu seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedMenu();
