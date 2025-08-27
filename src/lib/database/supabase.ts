import { createServerSupabaseClient } from '@/lib/supabase/client';
import { Database } from '@/lib/supabase-types';

export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

// Helper function to get Supabase client
export const getSupabaseClient = () => {
  return createServerSupabaseClient();
};

// Generic error handler
export const handleDatabaseError = (error: any, operation: string) => {
  console.error(`Database error in ${operation}:`, error);
  console.error('Error details:', {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
  });
  throw new Error(`Failed to ${operation}: ${error.message}`);
};

// Type-safe database operations
export class SupabaseDatabase {
  private client = getSupabaseClient();

  // Products
  async getProducts(filters?: {
    categoryId?: string;
    search?: string;
    isActive?: boolean;
  }) {
    try {
      let query = this.client
        .from('products')
        .select(`
          *,
          categories (
            id,
            name,
            icon
          ),
          product_extras (*)
        `);

      if (filters?.categoryId) {
        query = query.eq('categoryId', filters.categoryId);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('isActive', filters.isActive);
      } else {
        query = query.eq('isActive', true);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'fetch products');
    }
  }

  async createProduct(productData: {
    name: string;
    description?: string;
    price: number;
    cost?: number;
    stockQuantity: number;
    minStockLevel: number;
    categoryId?: string;
    barcode?: string;
    taxRate: number;
    image?: string;
    thumbnail?: string;
    extras?: Array<{ name: string; price: number; stockItemId?: string }>;
  }) {
    try {
      const { data: product, error: productError } = await this.client
        .from('products')
        .insert({
          id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: productData.name,
          description: productData.description,
          price: productData.price,
          cost: productData.cost,
          stockQuantity: productData.stockQuantity,
          minStockLevel: productData.minStockLevel,
          categoryId: productData.categoryId,
          barcode: productData.barcode,
          taxRate: productData.taxRate,
          image: productData.image,
          thumbnail: productData.thumbnail,
          isActive: true,
          updatedAt: new Date().toISOString(),
        })
        .select(`
          *,
          categories (
            id,
            name,
            icon
          )
        `)
        .single();

      if (productError) throw productError;

      // Create extras if provided
      if (productData.extras && productData.extras.length > 0) {
        const extrasData = productData.extras.map(extra => ({
          id: `extra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: product.id,
          name: extra.name,
          price: extra.price,
          stockItemId: extra.stockItemId,
          isActive: true,
          updatedAt: new Date().toISOString(),
        }));

        const { error: extrasError } = await this.client
          .from('product_extras')
          .insert(extrasData);

        if (extrasError) {
          console.error('Failed to create product extras:', extrasError);
        }
      }

      return product;
    } catch (error) {
      handleDatabaseError(error, 'create product');
    }
  }

  async updateProduct(id: string, updates: Partial<{
    name: string;
    description: string;
    price: number;
    cost: number;
    stockQuantity: number;
    minStockLevel: number;
    categoryId: string;
    barcode: string;
    taxRate: number;
    image: string;
    thumbnail: string;
    isActive: boolean;
  }>) {
    try {
      const { data, error } = await this.client
        .from('products')
        .update({
          name: updates.name,
          description: updates.description,
          price: updates.price,
          cost: updates.cost,
          stockQuantity: updates.stockQuantity,
          minStockLevel: updates.minStockLevel,
          categoryId: updates.categoryId,
          barcode: updates.barcode,
          taxRate: updates.taxRate,
          image: updates.image,
          thumbnail: updates.thumbnail,
          isActive: updates.isActive,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          categories (
            id,
            name,
            icon
          ),
          product_extras (*)
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'update product');
    }
  }

  async deleteProduct(id: string) {
    try {
      const { error } = await this.client
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      handleDatabaseError(error, 'delete product');
    }
  }

  // Categories
  async getCategories() {
    try {
      const { data, error } = await this.client
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'fetch categories');
    }
  }

  async createCategory(categoryData: { name: string; icon?: string }) {
    try {
      const { data, error } = await this.client
        .from('categories')
        .insert({
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: categoryData.name,
          icon: categoryData.icon || '🍴',
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'create category');
    }
  }

  // Orders
  async getOrders(filters?: {
    status?: string;
    search?: string;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    try {
      let query = this.client
        .from('orders')
        .select(`
          *,
          customers (*),
          tables (*),
          order_items (
            *,
            products (
              *,
              categories (*)
            )
          )
        `);

      if (filters?.status && filters.status !== 'All') {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`orderNumber.ilike.%${filters.search}%,customerName.ilike.%${filters.search}%,customerPhone.ilike.%${filters.search}%`);
      }

      if (filters?.customerId) {
        query = query.eq('customerId', filters.customerId);
      }

      if (filters?.dateFrom || filters?.dateTo) {
        if (filters.dateFrom) {
          query = query.gte('createdAt', filters.dateFrom);
        }
        if (filters.dateTo) {
          query = query.lte('createdAt', filters.dateTo);
        }
      }

      const { data, error } = await query.order('createdAt', { ascending: false });

      if (error) throw error;

      // Normalize relation key: Supabase returns `order_items` (table name).
      // Expose a camelCase `orderItems` array expected by the UI.
      const normalized = (data || []).map((raw: any) => {
        const relatedItems = Array.isArray(raw?.orderItems)
          ? raw.orderItems
          : (Array.isArray(raw?.order_items) ? raw.order_items : []);

        return {
          ...raw,
          orderItems: relatedItems,
        };
      });

      return normalized;
    } catch (error) {
      handleDatabaseError(error, 'fetch orders');
    }
  }

  async createOrder(orderData: {
    orderType: string;
    tableId?: string;
    tableNumber?: string;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    status: string;
    subStatus?: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paymentStatus: string;
    paymentMethod?: string;
    notes?: string;
    orderItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      customizationNotes?: string;
    }>;
  }) {
    try {
      // Generate unique order number and KOT number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      // Generate next KOT as an integer to match DB column type
      const kotNumber = await this.generateNextKOTNumberInt();

      // Handle customer creation/update
      let finalCustomerId = orderData.customerId;
      let finalCustomerName = orderData.customerName;

      if (orderData.customerName && orderData.customerName.trim()) {
        if (orderData.customerId) {
          // Update existing customer
          const { data: currentCustomer } = await this.client
            .from('customers')
            .select('totalPurchases')
            .eq('id', orderData.customerId)
            .single();
          
          if (currentCustomer) {
            await this.client
              .from('customers')
              .update({
                totalPurchases: (currentCustomer.totalPurchases || 0) + 1,
                updatedAt: new Date().toISOString(),
              })
              .eq('id', orderData.customerId);
          }
        } else if (orderData.customerPhone) {
          // Check if customer exists by phone
          const { data: existingCustomer } = await this.client
            .from('customers')
            .select('*')
            .eq('phone', orderData.customerPhone)
            .single();

          if (existingCustomer) {
            finalCustomerId = existingCustomer.id;
            finalCustomerName = existingCustomer.name;
            await this.client
              .from('customers')
              .update({
                totalPurchases: (existingCustomer.totalPurchases || 0) + 1,
                updatedAt: new Date().toISOString(),
              })
              .eq('id', existingCustomer.id);
          } else {
            // Create new customer
            const { data: newCustomer } = await this.client
              .from('customers')
              .insert({
                name: orderData.customerName.trim(),
                phone: orderData.customerPhone,
                totalPurchases: 1,
              })
              .select()
              .single();

            if (newCustomer) {
              finalCustomerId = newCustomer.id;
              finalCustomerName = newCustomer.name;
            }
          }
        }
      }

      // Create order
      const { data: order, error: orderError } = await this.client
        .from('orders')
        .insert({
          id: `ord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderNumber: orderNumber,
          kotNumber: kotNumber,
          orderType: orderData.orderType,
          tableId: orderData.tableId,
          tableNumber: orderData.tableNumber,
          customerId: finalCustomerId,
          customerName: finalCustomerName,
          customerPhone: orderData.customerPhone,
          status: orderData.status,
          subStatus: orderData.subStatus,
          subtotal: orderData.subtotal,
          taxAmount: orderData.taxAmount,
          discountAmount: orderData.discountAmount,
          totalAmount: orderData.totalAmount,
          paymentStatus: orderData.paymentStatus,
          paymentMethod: orderData.paymentMethod,
          notes: orderData.notes,
          updatedAt: new Date().toISOString(),
        })
        .select(`
          *,
          customers (*),
          order_items (
            *,
            products (
              *,
              categories (*)
            )
          )
        `)
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderData.orderItems.map(item => ({
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        orderId: order.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        customizationNotes: item.customizationNotes,
        updatedAt: new Date().toISOString(),
      }));

      const { error: itemsError } = await this.client
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Update product stock quantities
      for (const item of orderData.orderItems) {
        const { data: currentProduct } = await this.client
          .from('products')
          .select('stockQuantity')
          .eq('id', item.productId)
          .single();
        
        if (currentProduct) {
          await this.client
            .from('products')
            .update({
              stockQuantity: Math.max(0, (currentProduct.stockQuantity || 0) - item.quantity),
            })
            .eq('id', item.productId);
        }
      }

      // Update table status if dine-in
      if (orderData.orderType === 'dine-in' && orderData.tableId) {
        await this.client
          .from('tables')
          .update({ status: 'occupied' })
          .eq('id', orderData.tableId);
      }

      // Return normalized order including freshly inserted items so UI can display them immediately
      const normalized = {
        ...order,
        orderItems: orderItemsData,
      } as any;

      return normalized;
    } catch (error) {
      handleDatabaseError(error, 'create order');
    }
  }

  async updateOrder(id: string, updates: Partial<{
    status: string;
    subStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    notes: string;
    subtotal: number;
    taxAmount: number;
    serviceChargeAmount: number;
    totalAmount: number;
    orderItems: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      customizationNotes?: string;
    }>;
  }>) {
    try {
      // Build update payload only with provided fields
      const payload: any = {
        updatedAt: new Date().toISOString(),
      };
      if (typeof updates.status !== 'undefined') payload.status = updates.status;
      if (typeof updates.subStatus !== 'undefined') payload.subStatus = updates.subStatus;
      if (typeof updates.paymentStatus !== 'undefined') payload.paymentStatus = updates.paymentStatus;
      if (typeof updates.paymentMethod !== 'undefined') payload.paymentMethod = updates.paymentMethod;
      if (typeof updates.notes !== 'undefined') payload.notes = updates.notes;
      if (typeof updates.subtotal === 'number') payload.subtotal = updates.subtotal;
      if (typeof updates.taxAmount === 'number') payload.taxAmount = updates.taxAmount;
      if (typeof updates.serviceChargeAmount === 'number') payload.serviceChargeAmount = updates.serviceChargeAmount;
      if (typeof updates.totalAmount === 'number') payload.totalAmount = updates.totalAmount;

      if (Object.keys(payload).length > 1) {
        const { error: updateError } = await this.client
          .from('orders')
          .update(payload)
          .eq('id', id);
        if (updateError) throw updateError;
      }

      // Replace order items when provided
      if (Array.isArray(updates.orderItems)) {
        // Remove existing items
        const { error: deleteError } = await this.client
          .from('order_items')
          .delete()
          .eq('orderId', id);
        if (deleteError) throw deleteError;

        // Insert new items
        const itemsData = updates.orderItems.map((item) => ({
          id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          orderId: id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          customizationNotes: item.customizationNotes,
          updatedAt: new Date().toISOString(),
        }));

        if (itemsData.length > 0) {
          const { error: insertError } = await this.client
            .from('order_items')
            .insert(itemsData);
          if (insertError) throw insertError;
        }
      }

      // Return refreshed order
      const { data: refreshed, error: fetchError } = await this.client
        .from('orders')
        .select(`
          *,
          customers (*),
          order_items (
            *,
            products (
              *,
              categories (*)
            )
          )
        `)
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;
      return refreshed;
    } catch (error) {
      handleDatabaseError(error, 'update order');
    }
  }

  // KOT Number Generation
  async generateNextKOTNumber(): Promise<string> {
    try {
      const { data: lastOrder } = await this.client
        .from('orders')
        .select('kotNumber')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastOrder?.kotNumber) {
        nextNumber = Number(lastOrder.kotNumber) + 1;
      }

      return `KOT-${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating KOT number:', error);
      return `KOT-${Date.now()}`;
    }
  }

  // Integer KOT helper (DB stores integer)
  async generateNextKOTNumberInt(): Promise<number> {
    try {
      const { data: lastOrder } = await this.client
        .from('orders')
        .select('kotNumber')
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();

      let nextNumber = 1;
      if (lastOrder?.kotNumber) {
        nextNumber = Number(lastOrder.kotNumber) + 1;
      }
      return nextNumber;
    } catch (error) {
      console.error('Error generating next KOT integer:', error);
      return 1;
    }
  }

  // Tables
  async getTables() {
    try {
      const { data, error } = await this.client
        .from('tables')
        .select(`
          *,
          areas (*),
          floors (*),
          orders (
            id,
            orderNumber,
            status,
            paymentStatus,
            totalAmount,
            createdAt,
            orderType,
            tableId,
            tableNumber,
            customerName,
            customerPhone,
            customerId,
            orderItems (
              id,
              productId,
              productName,
              unitPrice,
              quantity,
              totalPrice,
              customizationNotes
            )
          )
        `)
        .order('tableNumber', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'fetch tables');
    }
  }

  async updateTableStatus(id: string, status: string) {
    try {
      const { data, error } = await this.client
        .from('tables')
        .update({
          status,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          areas (*),
          floors (*),
          orders (
            id,
            orderNumber,
            status,
            paymentStatus,
            totalAmount,
            createdAt,
            orderType,
            tableId,
            tableNumber,
            customerName,
            customerPhone,
            customerId,
            orderItems (
              id,
              productId,
              productName,
              unitPrice,
              quantity,
              totalPrice,
              customizationNotes
            )
          )
        `)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'update table status');
    }
  }

  // Customers
  async getCustomers() {
    try {
      const { data, error } = await this.client
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'fetch customers');
    }
  }

  async createCustomer(customerData: { name: string; phone?: string; email?: string }) {
    try {
      const { data, error } = await this.client
        .from('customers')
        .insert({
          id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          totalPurchases: 0,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'create customer');
    }
  }

  // Staff
  async getStaff() {
    try {
      const { data, error } = await this.client
        .from('staff')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'fetch staff');
    }
  }

  // Settings
  async getSettings() {
    try {
      const { data, error } = await this.client
        .from('settings')
        .select('*');

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'fetch settings');
    }
  }

  async updateSettings(updates: any) {
    try {
      const { data, error } = await this.client
        .from('settings')
        .update({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'update settings');
    }
  }

  // Billing Settings (list-style settings with multiple rows)
  async getBillingSettings(filters?: { key?: string; activeOnly?: boolean }) {
    try {
      let query = this.client
        .from('billing_settings')
        .select('*');

      if (filters?.key) {
        query = query.eq('key', filters.key);
      }
      if (filters?.activeOnly) {
        query = query.eq('isActive', true);
      }

      const { data, error } = await query.order('updatedAt', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (error) {
      handleDatabaseError(error, 'fetch billing settings');
    }
  }

  // Analytics
  async getAnalytics(dateFrom?: string, dateTo?: string) {
    try {
      let query = this.client
        .from('orders')
        .select('*');

      if (dateFrom) {
        query = query.gte('createdAt', dateFrom);
      }
      if (dateTo) {
        query = query.lte('createdAt', dateTo);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Calculate high-level metrics
      const totalOrders = orders?.length || 0;
      const totalSales = (orders || []).reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      // Orders by status
      const statusToCount: Record<string, number> = {};
      for (const order of orders || []) {
        const status = (order.status || 'unknown').toString();
        statusToCount[status] = (statusToCount[status] || 0) + 1;
      }
      const ordersByStatus = Object.entries(statusToCount).map(([status, count]) => ({ status, count }));

      // Build minimal chart data (group by date)
      const dateToSales: Record<string, number> = {};
      for (const order of orders || []) {
        const createdAt = order.createdAt ? new Date(order.createdAt) : null;
        if (!createdAt) continue;
        const key = createdAt.toISOString().slice(0, 10);
        dateToSales[key] = (dateToSales[key] || 0) + (order.totalAmount || 0);
      }
      const dailySales = Object.keys(dateToSales)
        .sort()
        .map((date) => ({ date, sales: dateToSales[date] }));

      // Return shape expected by the frontend
      return {
        period: 'custom',
        dateRange: {
          start: dateFrom || '',
          end: dateTo || ''
        },
        metrics: {
          totalSales,
          totalOrders,
          averageOrderValue,
          totalTax: 0,
          totalDiscount: 0,
          activeTables: 0,
        },
        ordersByStatus,
        popularProducts: [],
        inventory: {
          totalProducts: 0,
          totalStock: 0,
          lowStockProducts: [],
        },
        chartData: {
          dailySales,
        },
      };
    } catch (error) {
      handleDatabaseError(error, 'fetch analytics');
    }
  }
}

// Export singleton instance
export const supabaseDb = new SupabaseDatabase();
