import { CartItem, CartAddon, CartVariant } from '@/types/cart';
import { Product } from '@/types/product';

export function computePrice(item: Omit<CartItem, "totalPrice">): number {
  const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
  const variantPrice = item.variant?.price || 0;
  return (item.basePrice + addonsTotal + variantPrice) * item.quantity;
}

export function generateCartItemKey(productId: string, addons: CartAddon[], variant?: CartVariant): string {
  const addonIds = addons.map(a => a.id).sort();
  const variantId = variant?.id || null;
  
  return JSON.stringify({
    productId,
    addons: addonIds,
    variant: variantId,
  });
}

export function addToCart(
  cart: CartItem[], 
  product: Product, 
  addons: CartAddon[] = [], 
  variant?: CartVariant,
  quantity: number = 1,
  customizationNotes?: string
): CartItem[] {
  const cartItemKey = generateCartItemKey(product.id, addons, variant);
  const existingItem = cart.find(item => item.key === cartItemKey);

  if (existingItem) {
    // Update existing item
    const productNameWithExtras = [
      product.name,
      addons.length > 0 ? `(${addons.map(addon => addon.name).join(', ')})` : '',
      variant ? `(${variant.name})` : ''
    ].filter(Boolean).join(' ');

    const updatedItem = {
      ...existingItem,
      productName: productNameWithExtras,
      quantity: existingItem.quantity + quantity,
      customizationNotes: customizationNotes || existingItem.customizationNotes,
    };
    updatedItem.totalPrice = computePrice(updatedItem);
    
    return cart.map(item => 
      item.key === cartItemKey ? updatedItem : item
    );
  } else {
    // Add new item
    const productNameWithExtras = [
      product.name,
      addons.length > 0 ? `(${addons.map(addon => addon.name).join(', ')})` : '',
      variant ? `(${variant.name})` : ''
    ].filter(Boolean).join(' ');

    const newItem: CartItem = {
      key: cartItemKey,
      productId: product.id,
      productName: productNameWithExtras,
      basePrice: product.price,
      quantity,
      addons,
      variant,
      customizationNotes,
      totalPrice: computePrice({
        key: cartItemKey,
        productId: product.id,
        productName: productNameWithExtras,
        basePrice: product.price,
        quantity,
        addons,
        variant,
      }),
    };
    
    return [...cart, newItem];
  }
}

export function updateCartItemQuantity(cart: CartItem[], itemKey: string, newQuantity: number): CartItem[] {
  if (newQuantity <= 0) {
    return cart.filter(item => item.key !== itemKey);
  }
  
  return cart.map(item => {
    if (item.key !== itemKey) return item;
    
    const updatedItem = { ...item, quantity: newQuantity };
    updatedItem.totalPrice = computePrice(updatedItem);
    return updatedItem;
  });
}

export function removeCartItem(cart: CartItem[], itemKey: string): CartItem[] {
  return cart.filter(item => item.key !== itemKey);
}

export function updateCartItemCustomization(cart: CartItem[], itemKey: string, customizationNotes: string): CartItem[] {
  return cart.map(item => 
    item.key === itemKey 
      ? { ...item, customizationNotes }
      : item
  );
}

export function updateCartItemOptions(
  cart: CartItem[], 
  itemKey: string, 
  addons: CartAddon[], 
  product: Product,
  variant?: CartVariant | null
): CartItem[] {
  return cart.map(item => {
    if (item.key !== itemKey) return item;
    
    // Create new key with updated options
    const newKey = generateCartItemKey(item.productId, addons, variant || undefined);
    
    // Update product name with new addons/variants
    const productNameWithExtras = [
      product.name,
      addons.length > 0 ? `(${addons.map(addon => addon.name).join(', ')})` : '',
      variant ? `(${variant.name})` : ''
    ].filter(Boolean).join(' ');
    
    const updatedItem: CartItem = {
      ...item,
      key: newKey,
      productName: productNameWithExtras,
      addons,
      variant: variant || undefined,
    };
    
    updatedItem.totalPrice = computePrice(updatedItem);
    return updatedItem;
  });
}

export function calculateCartTotals(cart: CartItem[], products: Product[]): {
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
} {
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  
  // Calculate tax based on product-specific rates
  const tax = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    const taxRate = product?.taxRate || 0;
    return sum + (item.totalPrice * (taxRate / 100));
  }, 0);
  
  // Calculate service charge based on product-specific rates
  const serviceCharge = cart.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    const serviceChargeRate = product?.serviceChargeRate || 0;
    return sum + (item.totalPrice * (serviceChargeRate / 100));
  }, 0);
  
  const total = subtotal + tax + serviceCharge;
  
  return {
    subtotal,
    tax,
    serviceCharge,
    total,
  };
}

/**
 * Parses a product name that includes variant and addon information back into its components
 * Format: "Product Name (Addon1, Addon2) (Variant)"
 * @param productNameWithExtras - The product name with embedded variant/addon info
 * @returns Object with baseProductName, addons, and variant
 */
export function parseProductNameWithExtras(productNameWithExtras: string): {
  baseProductName: string;
  addons: string[];
  variant: string | null;
} {
  // Remove extra whitespace
  const trimmed = productNameWithExtras.trim();
  
  // Find addons pattern: (Addon1, Addon2) - should come before variant
  const addonsMatch = trimmed.match(/\(([^)]+)\)(?=\s*\([^)]*\)\s*$|$)/);
  const addons = addonsMatch ? addonsMatch[1].split(',').map(addon => addon.trim()) : [];
  
  // Find variant pattern: (Variant) - should be at the end
  const variantMatch = trimmed.match(/\(([^)]+)\)\s*$/);
  const variant = variantMatch ? variantMatch[1].trim() : null;
  
  // Extract base product name by removing addons and variant patterns
  let baseProductName = trimmed;
  
  // Remove variant pattern from the end
  if (variantMatch) {
    baseProductName = baseProductName.replace(/\s*\([^)]+\)\s*$/, '');
  }
  
  // Remove addons pattern
  if (addonsMatch) {
    baseProductName = baseProductName.replace(/\s*\([^)]+\)\s*$/, '');
  }
  
  return {
    baseProductName: baseProductName.trim(),
    addons,
    variant
  };
}

/**
 * Reconstructs a cart item from order item data by parsing the product name
 * and matching it with actual product, variant, and addon data
 * @param orderItem - The order item from the database
 * @param products - Array of all products
 * @returns Reconstructed cart item with proper variant and addon structure
 */
export function reconstructCartItemFromOrderItem(
  orderItem: any,
  products: Product[]
): CartItem {
  // Parse the product name to extract variant and addon information
  const { baseProductName, addons: addonNames, variant: variantName } = 
    parseProductNameWithExtras(orderItem.productName);
  
  // Find the base product
  const baseProduct = products.find(p => p.name === baseProductName);
  
  if (!baseProduct) {
    // Fallback: return a basic cart item if product not found
    return {
      key: `existing-${orderItem.productId}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
      productId: orderItem.productId,
      productName: orderItem.productName,
      basePrice: orderItem.unitPrice,
      quantity: orderItem.quantity,
      totalPrice: orderItem.totalPrice,
      addons: [],
      variant: undefined,
      customizationNotes: orderItem.customizationNotes || ''
    };
  }
  
  // Find matching addons
  const matchedAddons: CartAddon[] = [];
  if (addonNames.length > 0 && baseProduct.extras) {
    addonNames.forEach((addonName: string) => {
      const matchingAddon = baseProduct.extras?.find((addon: any) => addon.name === addonName);
      if (matchingAddon) {
        matchedAddons.push({
          id: matchingAddon.id,
          name: matchingAddon.name,
          price: matchingAddon.price
        });
      }
    });
  }
  
  // Find matching variant
  let matchedVariant: CartVariant | undefined = undefined;
  if (variantName && baseProduct.variants) {
    const matchingVariant = baseProduct.variants.find(variant => variant.name === variantName);
    if (matchingVariant) {
      matchedVariant = {
        id: matchingVariant.id,
        name: matchingVariant.name,
        price: matchingVariant.price
      };
    }
  }
  
  // Reconstruct the cart item
  const cartItem: CartItem = {
    key: `existing-${orderItem.productId}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,
    productId: orderItem.productId,
    productName: orderItem.productName, // Keep the original product name with extras
    basePrice: baseProduct.price,
    quantity: orderItem.quantity,
    addons: matchedAddons,
    variant: matchedVariant,
    customizationNotes: orderItem.customizationNotes || '',
    totalPrice: orderItem.totalPrice
  };
  
  return cartItem;
}
