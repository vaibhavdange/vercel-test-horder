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
          product_extras (*),
          product_variants (*)
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
        // Don't filter by isActive - show all products
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      
      // Transform the data to match frontend expectations
      const transformedData = data?.map((product: any) => ({
        ...product,
        category: product.categories,
        extras: product.product_extras,
        variants: product.product_variants,
        // Remove the plural version to avoid confusion
        categories: undefined,
        product_extras: undefined,
        product_variants: undefined
      })) || [];
      
      return transformedData;
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
    isAlcohol?: boolean;
    extras?: Array<{ name: string; price: number; stockItemId?: string }>;
    variants?: Array<{ name: string; price: number }>;
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
          isAlcohol: productData.isAlcohol ?? false,
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

      // Create variants if provided
      if (productData.variants && productData.variants.length > 0) {
        const variantsData = productData.variants.map(variant => ({
          id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: product.id,
          name: variant.name,
          price: variant.price,
          isActive: true,
          updatedAt: new Date().toISOString(),
        }));

        const { error: variantsError } = await this.client
          .from('product_variants')
          .insert(variantsData);

        if (variantsError) {
          console.error('Failed to create product variants:', variantsError);
        }
      }

      // Transform the data to match frontend expectations
      const transformedProduct = {
        ...product,
        category: product.categories,
        // Remove the plural version to avoid confusion
        categories: undefined
      };
      
      return transformedProduct;
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
    isAlcohol: boolean;
    extras?: Array<{ id?: string; name: string; price: number; stockItemId?: string }>;
    variants?: Array<{ name: string; price: number }>;
  }>) {
    try {
      // 1. Update the main product fields
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
          isAlcohol: updates.isAlcohol,
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
          product_extras (*),
          product_variants (*)
        `)
        .single();

      if (error) throw error;

      // 2. Update extras (add-ons) if provided
      if (updates.extras) {
        // Fetch current extras from DB
        const { data: currentExtras, error: extrasFetchError } = await this.client
          .from('product_extras')
          .select('*')
          .eq('productId', id);
        if (extrasFetchError) throw extrasFetchError;

        const currentExtrasMap = new Map((currentExtras || []).map((e: any) => [e.id, e]));
        const newExtrasMap = new Map((updates.extras || []).filter(e => e.id).map(e => [e.id, e]));

        // 2a. Update existing extras
        for (const extra of updates.extras) {
          if (extra.id && currentExtrasMap.has(extra.id)) {
            await this.client
              .from('product_extras')
              .update({
                name: extra.name,
                price: extra.price,
                stockItemId: extra.stockItemId,
                isActive: true,
                updatedAt: new Date().toISOString(),
              })
              .eq('id', extra.id);
          }
        }

        // 2b. Add new extras (no id)
        const newExtras = updates.extras.filter(e => !e.id);
        if (newExtras.length > 0) {
          const extrasData = newExtras.map(extra => ({
            id: `extra_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            productId: id,
            name: extra.name,
            price: extra.price,
            stockItemId: extra.stockItemId,
            isActive: true,
            updatedAt: new Date().toISOString(),
          }));
          await this.client.from('product_extras').insert(extrasData);
        }

        // 2c. Delete removed extras
        const newExtraIds = new Set((updates.extras || []).filter(e => e.id).map(e => e.id));
        const toDelete = (currentExtras || []).filter((e: any) => !newExtraIds.has(e.id));
        if (toDelete.length > 0) {
          await this.client.from('product_extras').delete().in('id', toDelete.map((e: any) => e.id));
        }
      }

      // 3. Transform the data to match frontend expectations
      const transformedData = {
        ...data,
        category: data.categories,
        extras: data.product_extras,
        variants: data.product_variants,
        // Remove the plural version to avoid confusion
        categories: undefined,
        product_extras: undefined,
        product_variants: undefined
      };
      return transformedData;
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

  // Product Variants
  async getProductVariants(productId: string) {
    try {
      const { data, error } = await this.client
        .from('product_variants')
        .select('*')
        .eq('productId', productId)
        .eq('isActive', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleDatabaseError(error, 'fetch product variants');
    }
  }

  async createProductVariant(productId: string, variantData: { name: string; price: number }) {
    try {
      const { data, error } = await this.client
        .from('product_variants')
        .insert({
          id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId,
          name: variantData.name,
          price: variantData.price,
          isActive: true,
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'create product variant');
    }
  }

  async updateProductVariant(id: string, updates: Partial<{ name: string; price: number; isActive: boolean }>) {
    try {
      const { data, error } = await this.client
        .from('product_variants')
        .update({
          name: updates.name,
          price: updates.price,
          isActive: updates.isActive,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'update product variant');
    }
  }

  async deleteProductVariant(id: string) {
    try {
      const { error } = await this.client
        .from('product_variants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      handleDatabaseError(error, 'delete product variant');
    }
  }

  // Categories
  async getCategories() {
    try {
      // First, get all categories
      const { data: categories, error: categoriesError } = await this.client
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Get product counts for each category
      const { data: productCounts, error: countsError } = await this.client
        .from('products')
        .select('categoryId')
        .eq('isActive', true);

      if (countsError) throw countsError;

      // Count products per category
      const categoryCounts = new Map<string, number>();
      productCounts?.forEach(product => {
        if (product.categoryId) {
          categoryCounts.set(product.categoryId, (categoryCounts.get(product.categoryId) || 0) + 1);
        }
      });

      // Add count information to categories
      const categoriesWithCounts = categories?.map(category => ({
        ...category,
        _count: {
          products: categoryCounts.get(category.id) || 0
        }
      })) || [];

      return categoriesWithCounts;
    } catch (error) {
      handleDatabaseError(error, 'fetch categories');
    }
  }

  async createCategory(categoryData: { name: string; description?: string; icon?: string }) {
    try {
      const { data, error } = await this.client
        .from('categories')
        .insert({
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: categoryData.name,
          description: categoryData.description || null,
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
        taxRate: (item as any).taxRate ?? 0,
        taxAmount: (item as any).taxAmount ?? ((item.unitPrice || 0) * (item.quantity || 0) * (((item as any).taxRate || 0) / 100)),
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
    discountAmount: number;
    serviceChargeAmount: number;
    serviceChargeRate: number;
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
      if (typeof updates.discountAmount === 'number') payload.discountAmount = updates.discountAmount;
      if (typeof updates.serviceChargeAmount === 'number') payload.serviceChargeAmount = updates.serviceChargeAmount;
      if (typeof updates.serviceChargeRate === 'number') payload.serviceChargeRate = updates.serviceChargeRate;
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
            subtotal,
            taxAmount,
            serviceChargeAmount,
            serviceChargeRate,
            discountAmount,
            createdAt,
            orderType,
            tableId,
            tableNumber,
            customerName,
            customerPhone,
            customerId,
            order_items (
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
      
      // Transform the data to match frontend expectations and filter out completed orders
      const transformedData = data?.map((table: any) => ({
        ...table,
        area: table.areas,
        floor: table.floors,
        // Keep unpaid orders regardless of completion status, filter out only paid completed orders
        orders: table.orders?.filter((order: any) => !(order.status === 'completed' && order.paymentStatus === 'paid')) || [],
        // Remove the plural versions to avoid confusion
        areas: undefined,
        floors: undefined
      })) || [];
      
      return transformedData;
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
            order_items (
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
      
      // Transform the data to match frontend expectations and filter out completed orders
      const transformedData = {
        ...data,
        area: data.areas,
        floor: data.floors,
        // Keep unpaid orders regardless of completion status, filter out only paid completed orders
        orders: data.orders?.filter((order: any) => !(order.status === 'completed' && order.paymentStatus === 'paid')) || [],
        // Remove the plural versions to avoid confusion
        areas: undefined,
        floors: undefined
      };
      
      return transformedData;
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
        .select(`
          *,
          users (*)
        `)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match frontend expectations
      const transformedData = (data || []).map((staff: any) => ({
        ...staff,
        user: staff.users,
        // Remove the plural version to avoid confusion
        users: undefined
      }));
      
      return transformedData;
    } catch (error) {
      handleDatabaseError(error, 'fetch staff');
    }
  }

  // Settings - Column-based approach
  async getSettings() {
    try {
      const { data, error } = await this.client
        .from('settings')
        .select('*')
        .eq('id', 'default_settings')
        .single();

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
        .eq('id', 'default_settings')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'update settings');
    }
  }

  // Restaurant Settings - Specific methods for restaurant configuration
  async getRestaurantSettings() {
    try {
      const { data, error } = await this.client
        .from('settings')
        .select(`
          restaurantname,
          restaurantid,
          storeid,
          addresslineone,
          addresslinetwo,
          restaurantcity,
          restaurantpin,
          restaurantphone,
          restaurantemail,
          restaurantwebsite,
          restaurantgstrate,
          restaurantgst,
          restauranttaxid,
          restaurantfssai,
          restaurantpolicy,
          restaurantfooternote,
          restaurantfooternoteextra,
          updated_at
        `)
        .eq('id', 'default_settings')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'fetch restaurant settings');
    }
  }

  async updateRestaurantSettings(updates: {
    restaurantName?: string;
    restaurantID?: string;
    storeID?: string;
    addressLineOne?: string;
    addressLineTwo?: string;
    restaurantCity?: string;
    restaurantPin?: string;
    restaurantPhone?: string;
    restaurantEmail?: string;
    restaurantWebsite?: string;
    restaurantGstRate?: number;
    restaurantGst?: string;
    restaurantTaxId?: string;
    restaurantFssai?: string;
    restaurantPolicy?: string;
    restaurantFooterNote?: string;
    restaurantFooterNoteExtra?: string;
  }) {
    try {
      // Map camelCase to snake_case for database
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.restaurantName !== undefined) dbUpdates.restaurantname = updates.restaurantName;
      if (updates.restaurantID !== undefined) dbUpdates.restaurantid = updates.restaurantID;
      if (updates.storeID !== undefined) dbUpdates.storeid = updates.storeID;
      if (updates.addressLineOne !== undefined) dbUpdates.addresslineone = updates.addressLineOne;
      if (updates.addressLineTwo !== undefined) dbUpdates.addresslinetwo = updates.addressLineTwo;
      if (updates.restaurantCity !== undefined) dbUpdates.restaurantcity = updates.restaurantCity;
      if (updates.restaurantPin !== undefined) dbUpdates.restaurantpin = updates.restaurantPin;
      if (updates.restaurantPhone !== undefined) dbUpdates.restaurantphone = updates.restaurantPhone;
      if (updates.restaurantEmail !== undefined) dbUpdates.restaurantemail = updates.restaurantEmail;
      if (updates.restaurantWebsite !== undefined) dbUpdates.restaurantwebsite = updates.restaurantWebsite;
      if (updates.restaurantGstRate !== undefined) dbUpdates.restaurantgstrate = updates.restaurantGstRate;
      if (updates.restaurantGst !== undefined) dbUpdates.restaurantgst = updates.restaurantGst;
      if (updates.restaurantTaxId !== undefined) dbUpdates.restauranttaxid = updates.restaurantTaxId;
      if (updates.restaurantFssai !== undefined) dbUpdates.restaurantfssai = updates.restaurantFssai;
      if (updates.restaurantPolicy !== undefined) dbUpdates.restaurantpolicy = updates.restaurantPolicy;
      if (updates.restaurantFooterNote !== undefined) dbUpdates.restaurantfooternote = updates.restaurantFooterNote;
      if (updates.restaurantFooterNoteExtra !== undefined) dbUpdates.restaurantfooternoteextra = updates.restaurantFooterNoteExtra;

      const { data, error } = await this.client
        .from('settings')
        .update(dbUpdates)
        .eq('id', 'default_settings')
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      handleDatabaseError(error, 'update restaurant settings');
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
  async getAnalytics(dateFrom?: string, dateTo?: string, period?: string) {
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

      // Get active tables count
      const { data: activeTables, error: tablesError } = await this.client
        .from('tables')
        .select('id')
        .eq('status', 'occupied');

      const activeTablesCount = tablesError ? 0 : (activeTables?.length || 0);

      // Orders by status
      const statusToCount: Record<string, number> = {};
      for (const order of orders || []) {
        const status = (order.status || 'unknown').toString();
        statusToCount[status] = (statusToCount[status] || 0) + 1;
      }
      const ordersByStatus = Object.entries(statusToCount).map(([status, count]) => ({ status, count }));

      // Get popular products
      const { data: orderItems, error: itemsError } = await this.client
        .from('order_items')
        .select(`
          productId,
          productName,
          quantity,
          unitPrice,
          products (
            id,
            name,
            image,
            thumbnail,
            categoryId
          )
        `);

      const productStats: Record<string, any> = {};
      if (!itemsError && orderItems) {
        for (const item of orderItems) {
          const productId = item.productId;
          if (!productStats[productId]) {
            productStats[productId] = {
              productId,
              productName: item.productName || (item.products as any)?.name || 'Unknown Product',
              totalQuantity: 0,
              totalRevenue: 0,
              image: (item.products as any)?.image || null,
              thumbnail: (item.products as any)?.thumbnail || null,
              categoryId: (item.products as any)?.categoryId || null,
            };
          }
          productStats[productId].totalQuantity += item.quantity || 0;
          productStats[productId].totalRevenue += (item.quantity || 0) * (item.unitPrice || 0);
        }
      }

      const popularProducts = Object.values(productStats)
        .sort((a: any, b: any) => b.totalQuantity - a.totalQuantity)
        .slice(0, 10);

      // Get low stock products
      const { data: productsForStock, error: stockError } = await this.client
        .from('products')
        .select(`
          id,
          name,
          stockQuantity,
          minStockLevel,
          image,
          thumbnail,
          categoryId,
          categories (
            name
          )
        `);

      const lowStockProducts = productsForStock?.filter((product: any) => 
        (product.stockQuantity || 0) < (product.minStockLevel || 0)
      ) || [];

      const lowStockData = stockError ? [] : (lowStockProducts || []).map((product: any) => ({
        id: product.id,
        name: product.name,
        currentStock: product.stockQuantity || 0,
        minStockLevel: product.minStockLevel || 0,
        category: product.categories?.name || 'Uncategorized',
        image: product.image || null,
        thumbnail: product.thumbnail || null,
        categoryId: product.categoryId || null,
      }));

      // Get inventory totals
      const { data: allProducts, error: productsError } = await this.client
        .from('products')
        .select('stockQuantity');

      const totalProducts = productsError ? 0 : (allProducts?.length || 0);
      const totalStock = productsError ? 0 : (allProducts || []).reduce((sum: number, product: any) => sum + (product.stockQuantity || 0), 0);

      // Build chart data (group by date)
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
        period: period || 'custom',
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
          activeTables: activeTablesCount,
        },
        ordersByStatus,
        popularProducts,
        inventory: {
          totalProducts,
          totalStock,
          lowStockProducts: lowStockData,
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
