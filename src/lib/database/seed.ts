import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create sample categories with emojis
  const categories = [
    {
        name: 'Main Course',
      description: 'Primary dishes and entrees',
      icon: '🍽️'
      },
    {
        name: 'Appetizers',
      description: 'Starters and small plates',
      icon: '🥗'
    },
    {
      name: 'Pizza',
      description: 'Italian pizza varieties',
      icon: '🍕'
    },
    {
      name: 'Burger',
      description: 'Gourmet burgers and sandwiches',
      icon: '🍔'
    },
    {
      name: 'Chicken',
      description: 'Chicken-based dishes',
      icon: '🍗'
    },
    {
      name: 'Bakery',
      description: 'Fresh baked goods',
      icon: '🧁'
    },
    {
      name: 'Seafood',
      description: 'Fresh seafood dishes',
      icon: '🦐'
    },
    {
      name: 'Beverages',
      description: 'Drinks and refreshments',
      icon: '🥤'
    },
    {
        name: 'Desserts',
      description: 'Sweet treats and cakes',
      icon: '🍰'
    },
    {
      name: 'Pasta',
      description: 'Italian pasta dishes',
      icon: '🍝'
    }
  ];

  console.log('📝 Creating categories...');
  for (const categoryData of categories) {
    const category = await prisma.category.create({
      data: categoryData
    });
    console.log(`✅ Created category: ${category.icon} ${category.name}`);
  }

  // Create sample customers
  const customers = [
    {
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-0101',
      address: '123 Main St, Downtown, NY 10001',
      loyaltyPoints: 150,
      totalPurchases: 450.75
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+1-555-0102',
      address: '456 Oak Ave, Uptown, NY 10002',
      loyaltyPoints: 320,
      totalPurchases: 890.25
    },
    {
      name: 'Mike Chen',
      email: 'mike.chen@email.com',
      phone: '+1-555-0103',
      address: '789 Pine Rd, Midtown, NY 10003',
      loyaltyPoints: 75,
      totalPurchases: 225.50
    },
    {
      name: 'Emily Davis',
      email: 'emily.davis@email.com',
      phone: '+1-555-0104',
      address: '321 Elm St, Westside, NY 10004',
      loyaltyPoints: 200,
      totalPurchases: 675.00
    },
    {
      name: 'David Wilson',
      email: 'david.wilson@email.com',
      phone: '+1-555-0105',
      address: '654 Maple Dr, Eastside, NY 10005',
      loyaltyPoints: 450,
      totalPurchases: 1200.75
    },
    {
      name: 'Lisa Brown',
      email: 'lisa.brown@email.com',
      phone: '+1-555-0106',
      address: '987 Cedar Ln, Northside, NY 10006',
      loyaltyPoints: 180,
      totalPurchases: 520.25
    },
    {
      name: 'Robert Taylor',
      email: 'robert.taylor@email.com',
      phone: '+1-555-0107',
      address: '147 Birch Way, Southside, NY 10007',
      loyaltyPoints: 95,
      totalPurchases: 310.50
    },
    {
      name: 'Jennifer Garcia',
      email: 'jennifer.garcia@email.com',
      phone: '+1-555-0108',
      address: '258 Spruce Ct, Central, NY 10008',
      loyaltyPoints: 275,
      totalPurchases: 780.00
    }
  ];

  console.log('👥 Creating customers...');
  for (const customerData of customers) {
    const customer = await prisma.customer.create({
      data: customerData
    });
    console.log(`✅ Created customer: ${customer.name} (${customer.phone})`);
  }

  // Create sample products
  const products = [
    {
      name: 'Margherita Pizza',
      description: 'Classic tomato, mozzarella, and basil pizza',
      price: 18.99,
      cost: 8.50,
          stockQuantity: 25,
          minStockLevel: 5,
      categoryId: 'pizza', // We'll need to get the actual ID
      barcode: 'PIZ001',
          taxRate: 8.5,
      isActive: true
    },
    {
      name: 'Classic Cheeseburger',
      description: 'Beef patty with cheese, lettuce, and tomato',
      price: 12.99,
      cost: 6.00,
      stockQuantity: 30,
      minStockLevel: 8,
      categoryId: 'burger',
      barcode: 'BUR001',
          taxRate: 8.5,
      isActive: true
    },
    {
      name: 'Grilled Chicken Breast',
      description: 'Seasoned grilled chicken with herbs',
      price: 16.99,
      cost: 9.00,
      stockQuantity: 20,
          minStockLevel: 5,
      categoryId: 'chicken',
      barcode: 'CHK001',
          taxRate: 8.5,
      isActive: true
    },
    {
      name: 'Chocolate Cake',
      description: 'Rich chocolate layer cake with frosting',
      price: 8.99,
      cost: 4.50,
      stockQuantity: 15,
      minStockLevel: 3,
      categoryId: 'bakery',
      barcode: 'CAK001',
      taxRate: 8.5,
      isActive: true
    },
    {
      name: 'Fresh Fruit Smoothie',
      description: 'Blend of seasonal fruits with yogurt',
      price: 6.99,
      cost: 3.00,
      stockQuantity: 40,
      minStockLevel: 10,
      categoryId: 'beverages',
      barcode: 'SMO001',
      taxRate: 8.5,
      isActive: true
    }
  ];

  console.log('🍕 Creating products...');
  
  // Get category IDs for products
  const pizzaCategory = await prisma.category.findFirst({ where: { name: 'Pizza' } });
  const burgerCategory = await prisma.category.findFirst({ where: { name: 'Burger' } });
  const chickenCategory = await prisma.category.findFirst({ where: { name: 'Chicken' } });
  const bakeryCategory = await prisma.category.findFirst({ where: { name: 'Bakery' } });
  const beveragesCategory = await prisma.category.findFirst({ where: { name: 'Beverages' } });

  const productsWithCategories = [
    { ...products[0], categoryId: pizzaCategory?.id || '' },
    { ...products[1], categoryId: burgerCategory?.id || '' },
    { ...products[2], categoryId: chickenCategory?.id || '' },
    { ...products[3], categoryId: bakeryCategory?.id || '' },
    { ...products[4], categoryId: beveragesCategory?.id || '' }
  ];

  for (const productData of productsWithCategories) {
    if (productData.categoryId) {
      const product = await prisma.product.create({
        data: productData
      });
      console.log(`✅ Created product: ${product.name} - $${product.price}`);
    }
  }

  // Create a sample user
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

  // Sample customer already created in the loop above

    console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
