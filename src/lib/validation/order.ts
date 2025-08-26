import { z } from "zod";

// Order item validation schema
export const OrderItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required"),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  unitPrice: z.number().positive("Unit price must be positive"),
  totalPrice: z.number().positive("Total price must be positive"),
  customizationNotes: z.string().optional(),
});

// Order validation schema
export const CreateOrderSchema = z.object({
  orderType: z.enum(["dine-in", "takeaway", "delivery"]),
  tableNumber: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().min(1, "Customer name is required"),
  customerPhone: z.string().optional(),
  status: z.enum(["pending", "in-process", "ready", "completed", "cancelled"]).default("pending"),
  subStatus: z.string().optional(),
  subtotal: z.number().positive("Subtotal must be positive"),
  taxAmount: z.number().min(0, "Tax amount cannot be negative"),
  discountAmount: z.number().min(0, "Discount amount cannot be negative"),
  totalAmount: z.number().positive("Total amount must be positive"),
  paymentStatus: z.enum(["pending", "paid", "refunded"]).default("pending"),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  orderItems: z.array(OrderItemSchema).min(1, "At least one order item is required"),
});

// Order update validation schema
export const UpdateOrderSchema = z.object({
  status: z.enum(["pending", "in-process", "ready", "completed", "cancelled"]).optional(),
  subStatus: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateOrderData = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderData = z.infer<typeof UpdateOrderSchema>;
export type OrderItemData = z.infer<typeof OrderItemSchema>;
