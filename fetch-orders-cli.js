// Fetch order IDs using Supabase CLI
// Run with: node fetch-orders-cli.js

const { createClient } = require('@supabase/supabase-js');

const fetchOrders = async () => {
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE; // Use service role for full access
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE are set');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('🔍 Fetching recent orders...\n');

    // Fetch recent orders with basic info
    const { data: orders, error } = await supabase
      .from('orders')
      .select(`
        id,
        orderNumber,
        orderType,
        customerName,
        subtotal,
        discountAmount,
        serviceChargeAmount,
        serviceChargeRate,
        taxAmount,
        totalAmount,
        paymentStatus,
        createdAt
      `)
      .order('createdAt', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Error fetching orders:', error);
      return;
    }

    if (!orders || orders.length === 0) {
      console.log('📭 No orders found');
      return;
    }

    console.log(`📋 Found ${orders.length} recent orders:\n`);

    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.id}`);
      console.log(`   Order Number: ${order.orderNumber}`);
      console.log(`   Type: ${order.orderType}`);
      console.log(`   Customer: ${order.customerName || 'Walk-in'}`);
      console.log(`   Subtotal: ₹${order.subtotal}`);
      console.log(`   Discount: ₹${order.discountAmount || 0}`);
      console.log(`   Service Charge: ₹${order.serviceChargeAmount || 0} (${order.serviceChargeRate || 0}%)`);
      console.log(`   Tax: ₹${order.taxAmount || 0}`);
      console.log(`   Total: ₹${order.totalAmount}`);
      console.log(`   Status: ${order.paymentStatus}`);
      console.log(`   Created: ${new Date(order.createdAt).toLocaleString()}`);
      console.log('   ---');
    });

    // Show orders with discounts/service charges
    const ordersWithAdjustments = orders.filter(o => 
      (o.discountAmount && o.discountAmount > 0) || 
      (o.serviceChargeAmount && o.serviceChargeAmount > 0)
    );

    if (ordersWithAdjustments.length > 0) {
      console.log(`\n🎯 Orders with discounts/service charges (${ordersWithAdjustments.length}):`);
      ordersWithAdjustments.forEach(order => {
        console.log(`   ${order.id} - ${order.orderNumber} - Discount: ₹${order.discountAmount || 0}, Service: ₹${order.serviceChargeAmount || 0}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
};

// Run the fetch
fetchOrders();
