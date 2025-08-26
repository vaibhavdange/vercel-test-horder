import { prisma } from '@/lib/database/prisma';
import { OrderItem } from '@/types/orders';

export interface InventoryDeductionResult {
  success: boolean;
  deductedItems: Array<{
    ingredientId: string;
    ingredientName: string;
    quantityDeducted: number;
    unit: string;
    previousStock: number;
    newStock: number;
  }>;
  errors: string[];
}

export class InventoryService {
  /**
   * Automatically deduct ingredients from inventory when an order is placed
   * This is the core function that implements the real-world inventory management
   */
  static async deductIngredientsFromOrder(orderItems: OrderItem[]): Promise<InventoryDeductionResult> {
    const result: InventoryDeductionResult = {
      success: true,
      deductedItems: [],
      errors: []
    };

    try {
      // Process each order item
      for (const orderItem of orderItems) {
        const deductionResult = await this.deductIngredientsForProduct(
          orderItem.productId,
          orderItem.quantity
        );

        if (deductionResult.success) {
          result.deductedItems.push(...deductionResult.deductedItems);
        } else {
          result.success = false;
          result.errors.push(...deductionResult.errors);
        }
      }

      return result;
    } catch (error) {
      console.error('Error deducting ingredients from order:', error);
      result.success = false;
      result.errors.push(`System error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Deduct ingredients for a specific product based on its recipe
   */
  private static async deductIngredientsForProduct(
    productId: string,
    quantity: number
  ): Promise<InventoryDeductionResult> {
    const result: InventoryDeductionResult = {
      success: true,
      deductedItems: [],
      errors: []
    };

    try {
      // Find the recipe for this product
      const recipe = await prisma.recipe.findFirst({
        where: { productId, isActive: true },
        include: {
          items: {
            include: {
              stockItem: true
            }
          }
        }
      });

      if (!recipe) {
        // No recipe found - this product doesn't use ingredients
        return result;
      }

      // Calculate quantities needed based on order quantity
      const multiplier = quantity / recipe.servings;

      // Process each ingredient in the recipe
      for (const recipeItem of recipe.items) {
        const stockItem = recipeItem.stockItem;
        if (!stockItem) {
          result.errors.push(`Stock item not found for recipe item: ${recipeItem.id}`);
          continue;
        }

        const quantityNeeded = recipeItem.quantity * multiplier;
        
        // Check if we have enough stock
        if (stockItem.stockQuantity < quantityNeeded) {
          result.success = false;
          result.errors.push(
            `Insufficient stock for ${stockItem.name}. Required: ${quantityNeeded} ${recipeItem.unit}, Available: ${stockItem.stockQuantity} ${recipeItem.unit}`
          );
          continue;
        }

        // Deduct the ingredient from inventory
        const newStock = stockItem.stockQuantity - quantityNeeded;
        
        await prisma.stockItem.update({
          where: { id: stockItem.id },
          data: { stockQuantity: newStock }
        });

        // Record the deduction
        result.deductedItems.push({
          ingredientId: stockItem.id,
          ingredientName: stockItem.name,
          quantityDeducted: quantityNeeded,
          unit: recipeItem.unit,
          previousStock: stockItem.stockQuantity,
          newStock: newStock
        });

        // Log the deduction for audit purposes
        await this.logInventoryDeduction({
          ingredientId: stockItem.id,
          ingredientName: stockItem.name,
          productId: productId,
          quantityDeducted: quantityNeeded,
          unit: recipeItem.unit,
          previousStock: stockItem.stockQuantity,
          newStock: newStock,
          reason: 'Order placed'
        });
      }

      return result;
    } catch (error) {
      console.error('Error deducting ingredients for product:', productId, error);
      result.success = false;
      result.errors.push(`Error processing product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Log inventory deductions for audit and tracking purposes
   */
  private static async logInventoryDeduction(data: {
    ingredientId: string;
    ingredientName: string;
    productId: string;
    quantityDeducted: number;
    unit: string;
    previousStock: number;
    newStock: number;
    reason: string;
  }) {
    try {
      // You can implement this as a separate table or use console logging
      // For now, we'll log to console and you can extend this later
      console.log('🔴 INVENTORY DEDUCTION:', {
        timestamp: new Date().toISOString(),
        ...data
      });

      // TODO: Create an InventoryTransaction table to track all inventory movements
      // await prisma.inventoryTransaction.create({
      //   data: {
      //     ingredientId: data.ingredientId,
      //     type: 'DEDUCTION',
      //     quantity: data.quantityDeducted,
      //     unit: data.unit,
      //     previousStock: data.previousStock,
      //     newStock: data.newStock,
      //     reason: data.reason,
      //     productId: data.productId
      //   }
      // });
    } catch (error) {
      console.error('Error logging inventory deduction:', error);
    }
  }

  /**
   * Get low stock alerts for ingredients that need replenishment
   */
  static async getLowStockAlerts(): Promise<Array<{
    ingredientId: string;
    ingredientName: string;
    currentStock: number;
    minStockLevel: number;
    unit: string;
    daysUntilStockout?: number;
  }>> {
    try {
      // Use raw SQL for complex comparison since Prisma doesn't support field-to-field comparison
      const lowStockStockItems = await prisma.$queryRaw<Array<{
        id: string;
        name: string;
        stockQuantity: number;
        minStockLevel: number;
        unit: string;
      }>>`
        SELECT id, name, "stockQuantity", "minStockLevel", unit
        FROM "stock_items"
        WHERE "isActive" = true 
        AND "stockQuantity" <= "minStockLevel"
        ORDER BY "stockQuantity" ASC
      `;

      return lowStockStockItems.map(stockItem => ({
        ingredientId: stockItem.id,
        ingredientName: stockItem.name,
        currentStock: stockItem.stockQuantity,
        minStockLevel: stockItem.minStockLevel,
        unit: stockItem.unit
      }));
    } catch (error) {
      console.error('Error getting low stock alerts:', error);
      return [];
    }
  }

  /**
   * Get ingredient usage analytics for business intelligence
   */
  static async getIngredientUsageAnalytics(days: number = 30): Promise<Array<{
    ingredientId: string;
    ingredientName: string;
    totalQuantityUsed: number;
    unit: string;
    averageDailyUsage: number;
    estimatedDaysUntilStockout: number;
  }>> {
    try {
      // This is a placeholder for the analytics functionality
      // You would implement this by querying the inventory transaction logs
      // For now, we'll return basic information from current stock levels
      
      const stockItems = await prisma.stockItem.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          stockQuantity: true,
          minStockLevel: true,
          unit: true
        }
      });

      return stockItems.map(stockItem => ({
        ingredientId: stockItem.id,
        ingredientName: stockItem.name,
        totalQuantityUsed: 0, // Would be calculated from transaction logs
        unit: stockItem.unit,
        averageDailyUsage: 0, // Would be calculated from transaction logs
        estimatedDaysUntilStockout: stockItem.stockQuantity > 0 ? 
          Math.floor(stockItem.stockQuantity / 0.1) : 0 // Placeholder calculation
      }));
    } catch (error) {
      console.error('Error getting ingredient usage analytics:', error);
      return [];
    }
  }

  /**
   * Restore ingredients to inventory (for order cancellations, returns, etc.)
   */
  static async restoreIngredientsToInventory(
    orderItems: OrderItem[]
  ): Promise<InventoryDeductionResult> {
    const result: InventoryDeductionResult = {
      success: true,
      deductedItems: [],
      errors: []
    };

    try {
      // Process each order item in reverse
      for (const orderItem of orderItems) {
        const restorationResult = await this.restoreIngredientsForProduct(
          orderItem.productId,
          orderItem.quantity
        );

        if (restorationResult.success) {
          result.deductedItems.push(...restorationResult.deductedItems);
        } else {
          result.success = false;
          result.errors.push(...restorationResult.errors);
        }
      }

      return result;
    } catch (error) {
      console.error('Error restoring ingredients to inventory:', error);
      result.success = false;
      result.errors.push(`System error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Restore ingredients for a specific product (reverse of deduction)
   */
  private static async restoreIngredientsForProduct(
    productId: string,
    quantity: number
  ): Promise<InventoryDeductionResult> {
    const result: InventoryDeductionResult = {
      success: true,
      deductedItems: [],
      errors: []
    };

    try {
      // Find the recipe for this product
      const recipe = await prisma.recipe.findFirst({
        where: { productId, isActive: true },
        include: {
          items: {
            include: {
              stockItem: true
            }
          }
        }
      });

      if (!recipe) {
        return result;
      }

      // Calculate quantities to restore based on order quantity
      const multiplier = quantity / recipe.servings;

      // Process each ingredient in the recipe
      for (const recipeItem of recipe.items) {
        const stockItem = recipeItem.stockItem;
        if (!stockItem) {
          result.errors.push(`Stock item not found for recipe item: ${recipeItem.id}`);
          continue;
        }

        const quantityToRestore = recipeItem.quantity * multiplier;
        const newStock = stockItem.stockQuantity + quantityToRestore;
        
        // Update the ingredient stock
        await prisma.stockItem.update({
          where: { id: stockItem.id },
          data: { stockQuantity: newStock }
        });

        // Record the restoration
        result.deductedItems.push({
          ingredientId: stockItem.id,
          ingredientName: stockItem.name,
          quantityDeducted: -quantityToRestore, // Negative to indicate restoration
          unit: recipeItem.unit,
          previousStock: stockItem.stockQuantity,
          newStock: newStock
        });

        // Log the restoration
        await this.logInventoryDeduction({
          ingredientId: stockItem.id,
          ingredientName: stockItem.name,
          productId: productId,
          quantityDeducted: -quantityToRestore,
          unit: recipeItem.unit,
          previousStock: stockItem.stockQuantity,
          newStock: newStock,
          reason: 'Order cancelled/returned'
        });
      }

      return result;
    } catch (error) {
      console.error('Error restoring ingredients for product:', productId, error);
      result.success = false;
      result.errors.push(`Error processing product ${productId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }
}
