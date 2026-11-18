export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      expenses: {
        Row: {
          amount: number | null
          category: string | null
          date: string | null
          id: string
          property_id: string | null
          unit_id: string | null
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          amount?: number | null
          category?: string | null
          date?: string | null
          id?: string
          property_id?: string | null
          unit_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          date?: string | null
          id?: string
          property_id?: string | null
          unit_id?: string | null
          user_id?: string | null
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
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties"
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
          deposit: number | null
          doc_url: string | null
          end_date: string | null
          id: string
          monthly_rent: number | null
          parsed_json: Json | null
          property_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string | null
          unit_id: string | null
          user_id: string | null
          vacancy_rate: number | null
        }
        ComputedFields: never
        Insert: {
          confidence_scores?: Json | null
          deposit?: number | null
          doc_url?: string | null
          end_date?: string | null
          id?: string
          monthly_rent?: number | null
          parsed_json?: Json | null
          property_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id?: string | null
          unit_id?: string | null
          user_id?: string | null
          vacancy_rate?: number | null
        }
        Update: {
          confidence_scores?: Json | null
          deposit?: number | null
          doc_url?: string | null
          end_date?: string | null
          id?: string
          monthly_rent?: number | null
          parsed_json?: Json | null
          property_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id?: string | null
          unit_id?: string | null
          user_id?: string | null
          vacancy_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leases_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties"
            referencedColumns: ["id"]
          },
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
      mortgages: {
        Row: {
          current_balance: number | null
          id: string
          includes_escrow: boolean | null
          interest_rate: number | null
          loan_name: string | null
          monthly_payment: number | null
          principal: number | null
          principal_original: number | null
          property_id: string | null
          start_date: string | null
          term_months: number | null
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          current_balance?: number | null
          id?: string
          includes_escrow?: boolean | null
          interest_rate?: number | null
          loan_name?: string | null
          monthly_payment?: number | null
          principal?: number | null
          principal_original?: number | null
          property_id?: string | null
          start_date?: string | null
          term_months?: number | null
          user_id?: string | null
        }
        Update: {
          current_balance?: number | null
          id?: string
          includes_escrow?: boolean | null
          interest_rate?: number | null
          loan_name?: string | null
          monthly_payment?: number | null
          principal?: number | null
          principal_original?: number | null
          property_id?: string | null
          start_date?: string | null
          term_months?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mortgages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortgages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          alias: string | null
          id: string
          insurance: number | null
          maintenance_pct: number | null
          mgmt_pct: number | null
          name: string | null
          opex_inflation_rate: number | null
          property_taxes: number | null
          property_value: number | null
          purchase_price: number | null
          rent_growth_rate: number | null
          sale_price: number | null
          total_units: number | null
          type: string | null
          user_id: string | null
          vacancy_pct: number | null
        }
        ComputedFields: never
        Insert: {
          address?: string | null
          alias?: string | null
          id?: string
          insurance?: number | null
          maintenance_pct?: number | null
          mgmt_pct?: number | null
          name?: string | null
          opex_inflation_rate?: number | null
          property_taxes?: number | null
          property_value?: number | null
          purchase_price?: number | null
          rent_growth_rate?: number | null
          sale_price?: number | null
          total_units?: number | null
          type?: string | null
          user_id?: string | null
          vacancy_pct?: number | null
        }
        Update: {
          address?: string | null
          alias?: string | null
          id?: string
          insurance?: number | null
          maintenance_pct?: number | null
          mgmt_pct?: number | null
          name?: string | null
          opex_inflation_rate?: number | null
          property_taxes?: number | null
          property_value?: number | null
          purchase_price?: number | null
          rent_growth_rate?: number | null
          sale_price?: number | null
          total_units?: number | null
          type?: string | null
          user_id?: string | null
          vacancy_pct?: number | null
        }
        Relationships: []
      }
      tenants: {
        Row: {
          id: string
          name: string | null
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          id: string
          property_id: string | null
          unit_label: string | null
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          id?: string
          property_id?: string | null
          unit_label?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          property_id?: string | null
          unit_label?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_mortgages: {
        Row: {
          address: string | null
          alias: string | null
          current_balance: number | null
          id: string | null
          includes_escrow: boolean | null
          interest_rate: number | null
          loan_name: string | null
          monthly_payment: number | null
          name: string | null
          principal: number | null
          principal_original: number | null
          property_id: string | null
          start_date: string | null
          term_months: number | null
        }
        ComputedFields: never
        Relationships: [
          {
            foreignKeyName: "mortgages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mortgages_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      v_properties: {
        Row: {
          address: string | null
          alias: string | null
          id: string | null
          maintenance_pct: number | null
          mgmt_pct: number | null
          name: string | null
          opex_inflation_rate: number | null
          property_taxes: number | null
          property_value: number | null
          purchase_price: number | null
          rent_growth_rate: number | null
          sale_price: number | null
          type: string | null
          vacancy_pct: number | null
        }
        ComputedFields: never
        Insert: {
          address?: string | null
          alias?: string | null
          id?: string | null
          maintenance_pct?: number | null
          mgmt_pct?: number | null
          name?: string | null
          opex_inflation_rate?: number | null
          property_taxes?: number | null
          property_value?: number | null
          purchase_price?: number | null
          rent_growth_rate?: number | null
          sale_price?: number | null
          type?: string | null
          vacancy_pct?: number | null
        }
        Update: {
          address?: string | null
          alias?: string | null
          id?: string | null
          maintenance_pct?: number | null
          mgmt_pct?: number | null
          name?: string | null
          opex_inflation_rate?: number | null
          property_taxes?: number | null
          property_value?: number | null
          purchase_price?: number | null
          rent_growth_rate?: number | null
          sale_price?: number | null
          type?: string | null
          vacancy_pct?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      update_property_unit_count: {
        Args: { target_property: string }
        Returns: number
      }
    }
    Enums: {
      lease_status: "active" | "expiring" | "expired" | "vacant"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      lease_status: ["active", "expiring", "expired", "vacant"],
    },
  },
} as const
