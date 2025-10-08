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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at: string | null
          date: string
          id: string
          memo: string | null
          property_id: string | null
          receipt_url: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          date: string
          id?: string
          memo?: string | null
          property_id?: string | null
          receipt_url?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["expense_category"]
          created_at?: string | null
          date?: string
          id?: string
          memo?: string | null
          property_id?: string | null
          receipt_url?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      leases: {
        Row: {
          confidence_scores: Json | null
          created_at: string | null
          deposit: number | null
          doc_url: string | null
          end_date: string
          grace_period_days: number | null
          id: string
          late_fee_amount: number | null
          monthly_rent: number
          notice_days: number | null
          parsed_json: Json | null
          start_date: string
          status: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string
          unit_id: string
          updated_at: string | null
          vacancy_rate: number | null
        }
        Insert: {
          confidence_scores?: Json | null
          created_at?: string | null
          deposit?: number | null
          doc_url?: string | null
          end_date: string
          grace_period_days?: number | null
          id?: string
          late_fee_amount?: number | null
          monthly_rent: number
          notice_days?: number | null
          parsed_json?: Json | null
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string
          unit_id: string
          updated_at?: string | null
          vacancy_rate?: number | null
        }
        Update: {
          confidence_scores?: Json | null
          created_at?: string | null
          deposit?: number | null
          doc_url?: string | null
          end_date?: string
          grace_period_days?: number | null
          id?: string
          late_fee_amount?: number | null
          monthly_rent?: number
          notice_days?: number | null
          parsed_json?: Json | null
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id?: string
          unit_id?: string
          updated_at?: string | null
          vacancy_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          status: Database["public"]["Enums"]["maintenance_status"] | null
          title: string
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          title: string
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          status?: Database["public"]["Enums"]["maintenance_status"] | null
          title?: string
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      mortgages: {
        Row: {
          created_at: string | null
          id: string
          interest_rate: number
          loan_name: string
          monthly_payment: number
          principal: number
          property_id: string
          start_date: string
          term_months: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interest_rate: number
          loan_name?: string
          monthly_payment: number
          principal: number
          property_id: string
          start_date: string
          term_months: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interest_rate?: number
          loan_name?: string
          monthly_payment?: number
          principal?: number
          property_id?: string
          start_date?: string
          term_months?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mortgages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_due: number
          created_at: string | null
          due_date: string
          id: string
          lease_id: string
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount_due: number
          created_at?: string | null
          due_date: string
          id?: string
          lease_id: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount_due?: number
          created_at?: string | null
          due_date?: string
          id?: string
          lease_id?: string
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_lease_id_fkey"
            columns: ["lease_id"]
            isOneToOne: false
            referencedRelation: "leases"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          created_at: string | null
          id: string
          mortgage_payment: number | null
          opex_inflation_rate: number | null
          property_value: number | null
          purchase_price: number | null
          rent_growth_rate: number | null
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          mortgage_payment?: number | null
          opex_inflation_rate?: number | null
          property_value?: number | null
          purchase_price?: number | null
          rent_growth_rate?: number | null
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          mortgage_payment?: number | null
          opex_inflation_rate?: number | null
          property_value?: number | null
          purchase_price?: number | null
          rent_growth_rate?: number | null
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string | null
          id: string
          property_id: string
          unit_label: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          property_id: string
          unit_label: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string
          unit_label?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      expense_category:
        | "repairs"
        | "pm"
        | "tax"
        | "insurance"
        | "capex"
        | "utilities"
        | "hoa"
        | "advertising"
        | "other"
      lease_status: "active" | "expiring" | "expired" | "vacant"
      maintenance_status: "pending" | "in_progress" | "completed"
      payment_status: "paid" | "overdue" | "pending"
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
      expense_category: [
        "repairs",
        "pm",
        "tax",
        "insurance",
        "capex",
        "utilities",
        "hoa",
        "advertising",
        "other",
      ],
      lease_status: ["active", "expiring", "expired", "vacant"],
      maintenance_status: ["pending", "in_progress", "completed"],
      payment_status: ["paid", "overdue", "pending"],
    },
  },
} as const
