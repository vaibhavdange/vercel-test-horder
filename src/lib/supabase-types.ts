export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          barcode: string | null
          name: string
          description: string | null
          price: number
          cost: number | null
          categoryId: string | null
          taxCategoryId: string | null
          stockQuantity: number
          minStockLevel: number
          taxRate: number
          serviceChargeRate: number
          image: string | null
          thumbnail: string | null
          isActive: boolean
          createdAt: string
          updatedAt: string
        }
        Insert: {
          id?: string
          barcode?: string | null
          name: string
          description?: string | null
          price: number
          cost?: number | null
          categoryId?: string | null
          taxCategoryId?: string | null
          stockQuantity?: number
          minStockLevel?: number
          taxRate?: number
          serviceChargeRate?: number
          image?: string | null
          thumbnail?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
        Update: {
          id?: string
          barcode?: string | null
          name?: string
          description?: string | null
          price?: number
          cost?: number | null
          categoryId?: string | null
          taxCategoryId?: string | null
          stockQuantity?: number
          minStockLevel?: number
          taxRate?: number
          serviceChargeRate?: number
          image?: string | null
          thumbnail?: string | null
          isActive?: boolean
          createdAt?: string
          updatedAt?: string
        }
      }
      // Add other table types as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
