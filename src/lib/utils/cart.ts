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
    const updatedItem = {
      ...existingItem,
      quantity: existingItem.quantity + quantity,
      customizationNotes: customizationNotes || existingItem.customizationNotes,
    };
    updatedItem.totalPrice = computePrice(updatedItem);
    
    return cart.map(item => 
      item.key === cartItemKey ? updatedItem : item
    );
  } else {
    // Add new item
    const newItem: CartItem = {
      key: cartItemKey,
      productId: product.id,
      productName: product.name,
      basePrice: product.price,
      quantity,
      addons,
      variant,
      customizationNotes,
      totalPrice: computePrice({
        productId: product.id,
        productName: product.name,
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
