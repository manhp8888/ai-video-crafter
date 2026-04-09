export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      balance_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_products: {
        Row: {
          category: string
          content: string | null
          created_at: string
          created_by: string | null
          description: string | null
          details: string | null
          id: string
          image_url: string | null
          is_active: boolean
          price: number
          sales_count: number | null
          stock: number | null
          title: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          details?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          sales_count?: number | null
          stock?: number | null
          title: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          details?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          price?: number
          sales_count?: number | null
          stock?: number | null
          title?: string
        }
        Relationships: []
      }
      premium_activations: {
        Row: {
          activated_at: string
          code_id: string
          expires_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          activated_at?: string
          code_id: string
          expires_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activated_at?: string
          code_id?: string
          expires_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_activations_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "premium_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          id: string
          is_active: boolean
          max_uses: number
          premium_days: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          id?: string
          is_active?: boolean
          max_uses?: number
          premium_days?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          id?: string
          is_active?: boolean
          max_uses?: number
          premium_days?: number
        }
        Relationships: []
      }
      product_items: {
        Row: {
          content: string
          created_at: string
          id: string
          is_sold: boolean
          product_id: string
          sold_at: string | null
          sold_to: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_sold?: boolean
          product_id: string
          sold_at?: string | null
          sold_to?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_sold?: boolean
          product_id?: string
          sold_at?: string | null
          sold_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          balance: number
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          balance?: number
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          count: number
          feature: string
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          count?: number
          feature: string
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          count?: number
          feature?: string
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          id: string
          product_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          product_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          product_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
