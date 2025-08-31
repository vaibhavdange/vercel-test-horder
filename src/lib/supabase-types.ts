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
      // BetterAuth standard tables
      users: {
        Row: {
          id: string
          email: string
          emailVerified: boolean
          name: string | null
          image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          emailVerified?: boolean
          name?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          emailVerified?: boolean
          name?: string | null
          image?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          userId: string
          expiresAt: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          userId: string
          expiresAt: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          userId?: string
          expiresAt?: string
          created_at?: string
          updated_at?: string
        }
      }
      verification_tokens: {
        Row: {
          identifier: string
          token: string
          expiresAt: string
          created_at: string
        }
        Insert: {
          identifier: string
          token: string
          expiresAt: string
          created_at?: string
        }
        Update: {
          identifier?: string
          token?: string
          expiresAt?: string
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          userId: string
          provider: string
          providerAccountId: string
          refresh_token: string | null
          access_token: string | null
          expires_at: number | null
          token_type: string | null
          scope: string | null
          id_token: string | null
          session_state: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          userId: string
          provider: string
          providerAccountId: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          userId?: string
          provider?: string
          providerAccountId?: string
          refresh_token?: string | null
          access_token?: string | null
          expires_at?: number | null
          token_type?: string | null
          scope?: string | null
          id_token?: string | null
          session_state?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Legacy tables (keeping for backward compatibility)
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
          cost?: string | null
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
