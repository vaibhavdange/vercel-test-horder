import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCustomersAndOrders() {
  try {
    console.log('👥 Starting customer and order seeding...');

    // Create sample customers
    console.log('👤 Creating customers...');
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
      }
    ];

    const createdCustomers = [];
    for (const customerData of customers) {
      const customer = await prisma.customer.create({
        data: customerData
      });
      createdCustomers.push(customer);
      console.log(`✅ Created customer: ${customer.name} (${customer.phone})`);
    }

    // Get some products for orders
    const products = await prisma.product.findMany({
      take: 5
    });

    if (products.length === 0) {
      console.log('⚠️ No products found. Please run menu seeding first.');
      return;
    }

    // Create sample orders
    console.log('📋 Creating sample orders...');
    const orders = [
      {
        customerId: createdCustomers[0]?.id,
        customerName: 'John Smith',
        customerPhone: '+1-555-0101',
        orderType: 'dine-in',
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'card',
        subtotal: 45.97,
        taxAmount: 3.68,
        serviceChargeAmount: 4.60,
        serviceChargeRate: 0.10,
        totalAmount: 54.25,
        notes: 'Extra cheese on pizza, well-done burger',
        items: [
          {
            productId: products[0]?.id,
            productName: products[0]?.name || 'Margherita Pizza',
            quantity: 1,
            unitPrice: 18.99,
            totalPrice: 18.99
          },
          {
            productId: products[2]?.id,
            productName: products[2]?.name || 'Classic Cheeseburger',
            quantity: 1,
            unitPrice: 14.99,
            totalPrice: 14.99
          },
          {
            productId: products[7]?.id,
            productName: products[7]?.name || 'Fresh Fruit Smoothie',
            quantity: 1,
            unitPrice: 7.99,
            totalPrice: 7.99
          }
        ]
      },
      {
        customerId: createdCustomers[1]?.id,
        customerName: 'Sarah Johnson',
        customerPhone: '+1-555-0102',
        orderType: 'takeaway',
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'cash',
        subtotal: 38.98,
        taxAmount: 3.12,
        serviceChargeAmount: 0,
        serviceChargeRate: 0,
        totalAmount: 42.10,
        notes: 'No onions on salad',
        items: [
          {
            productId: products[3]?.id,
            productName: products[3]?.name || 'Chicken Caesar Salad',
            quantity: 1,
            unitPrice: 16.99,
            totalPrice: 16.99
          },
          {
            productId: products[4]?.id,
            productName: products[4]?.name || 'Spaghetti Carbonara',
            quantity: 1,
            unitPrice: 19.99,
            totalPrice: 19.99
          }
        ]
      },
      {
        customerId: createdCustomers[2]?.id,
        customerName: 'Mike Chen',
        customerPhone: '+1-555-0103',
        orderType: 'dine-in',
        status: 'in-process',
        paymentStatus: 'pending',
        paymentMethod: null,
        subtotal: 28.98,
        taxAmount: 2.32,
        serviceChargeAmount: 2.90,
        serviceChargeRate: 0.10,
        totalAmount: 34.20,
        notes: 'Medium rare burger',
        items: [
          {
            productId: products[2]?.id,
            productName: products[2]?.name || 'Classic Cheeseburger',
            quantity: 1,
            unitPrice: 14.99,
            totalPrice: 14.99
          },
          {
            productId: products[8]?.id,
            productName: products[8]?.name || 'Espresso',
            quantity: 2,
            unitPrice: 3.99,
            totalPrice: 7.98
          },
          {
            productId: products[6]?.id,
            productName: products[6]?.name || 'Chocolate Lava Cake',
            quantity: 1,
            unitPrice: 9.99,
            totalPrice: 9.99
          }
        ]
      }
    ];

    for (const orderData of orders) {
      if (orderData.customerId) {
        const order = await prisma.order.create({
          data: {
            orderNumber: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            kotNumber: Math.floor(Math.random() * 100) + 1,
            orderType: orderData.orderType,
            customerId: orderData.customerId,
            customerName: orderData.customerName,
            customerPhone: orderData.customerPhone,
            status: orderData.status,
            paymentStatus: orderData.paymentStatus,
            paymentMethod: orderData.paymentMethod,
            subtotal: orderData.subtotal,
            taxAmount: orderData.taxAmount,
            serviceChargeAmount: orderData.serviceChargeAmount,
            serviceChargeRate: orderData.serviceChargeRate,
            totalAmount: orderData.totalAmount,
            notes: orderData.notes
          }
        });

        // Create order items
        for (const itemData of orderData.items) {
          if (itemData.productId) {
            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                productId: itemData.productId,
                productName: itemData.productName,
                quantity: itemData.quantity,
                unitPrice: itemData.unitPrice,
                totalPrice: itemData.totalPrice
              }
            });
          }
        }

        console.log(`✅ Created order: ${order.orderNumber} for ${order.customerName} - $${order.totalAmount}`);
      }
    }

    // Create some reservations
    console.log('📅 Creating sample reservations...');
    const reservations = [
      {
        customerName: 'Emily Davis',
        customerPhone: '+1-555-0104',
        customerEmail: 'emily.davis@email.com',
        reservationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        reservationTime: '19:00',
        partySize: 4,
        specialRequests: 'Window table if possible'
      },
      {
        customerName: 'David Wilson',
        customerPhone: '+1-555-0105',
        customerEmail: 'david.wilson@email.com',
        reservationDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
        reservationTime: '20:00',
        partySize: 2,
        specialRequests: 'Quiet corner table'
      }
    ];

    for (const reservationData of reservations) {
      const customer = createdCustomers.find(c => c.name === reservationData.customerName);
      const reservation = await prisma.reservation.create({
        data: {
          ...reservationData,
          customerId: customer?.id,
          status: 'confirmed'
        }
      });
      console.log(`✅ Created reservation: ${reservation.customerName} for ${reservation.partySize} on ${reservation.reservationDate.toLocaleDateString()} at ${reservation.reservationTime}`);
    }

    console.log('🎉 Customer and order seeding completed successfully!');
    
    // Display summary
    const totalCustomers = await prisma.customer.count();
    const totalOrders = await prisma.order.count();
    const totalReservations = await prisma.reservation.count();
    
    console.log(`📊 Summary:`);
    console.log(`   - Total Customers: ${totalCustomers}`);
    console.log(`   - Total Orders: ${totalOrders}`);
    console.log(`   - Total Reservations: ${totalReservations}`);

  } catch (error) {
    console.error('❌ Error during customer and order seeding:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedCustomersAndOrders();
