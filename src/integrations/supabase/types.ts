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
      dealstack_mortgage_statements: {
        Row: { id: string; user_id: string; mortgage_id: string; statement_date: string; principal_balance: number; document_path: string; created_at: string }
        Insert: { id: string; user_id: string; mortgage_id: string; statement_date: string; principal_balance: number; document_path: string; created_at?: string }
        Update: { id?: string; user_id?: string; mortgage_id?: string; statement_date?: string; principal_balance?: number; document_path?: string; created_at?: string }
        Relationships: [{
          foreignKeyName: "dealstack_mortgage_statements_mortgage_id_fkey"
          columns: ["mortgage_id"]
          isOneToOne: false
          referencedRelation: "mortgages"
          referencedColumns: ["id"]
        }]
      }
      dealstack_workspace_entries: {
        Row: { created_at: string; id: string; payload: Json; user_id: string }
        Insert: { created_at?: string; id?: string; payload: Json; user_id?: string }
        Update: { created_at?: string; id?: string; payload?: Json; user_id?: string }
        Relationships: []
      }
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
          user_id: string | null
        }
        ComputedFields: never
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
          user_id?: string | null
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
          property_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string
          unit_id: string
          updated_at: string | null
          user_id: string | null
          vacancy_rate: number | null
        }
        ComputedFields: never
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
          property_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id: string
          unit_id: string
          updated_at?: string | null
          user_id?: string | null
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
          property_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["lease_status"] | null
          tenant_id?: string
          unit_id?: string
          updated_at?: string | null
          user_id?: string | null
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
          user_id: string | null
        }
        ComputedFields: never
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
          user_id?: string | null
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
          user_id?: string | null
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
          current_balance: number | null
          id: string
          includes_escrow: boolean | null
          interest_rate: number
          loan_name: string
          monthly_payment: number
          principal: number
          principal_original: number | null
          property_id: string
          start_date: string
          term_months: number
          updated_at: string | null
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string | null
          current_balance?: number | null
          id?: string
          includes_escrow?: boolean | null
          interest_rate: number
          loan_name?: string
          monthly_payment: number
          principal: number
          principal_original?: number | null
          property_id: string
          start_date: string
          term_months: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_balance?: number | null
          id?: string
          includes_escrow?: boolean | null
          interest_rate?: number
          loan_name?: string
          monthly_payment?: number
          principal?: number
          principal_original?: number | null
          property_id?: string
          start_date?: string
          term_months?: number
          updated_at?: string | null
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
          user_id: string | null
        }
        ComputedFields: never
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
          user_id?: string | null
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
          user_id?: string | null
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
          alias: string | null
          created_at: string | null
          id: string
          insurance: number | null
          maintenance_pct: number | null
          mgmt_pct: number | null
          mortgage_payment: number | null
          name: string | null
          opex_inflation_rate: number | null
          property_taxes: number | null
          property_value: number | null
          purchase_price: number | null
          rent_growth_rate: number | null
          sale_price: number | null
          total_units: number | null
          type: string | null
          updated_at: string | null
          user_id: string | null
          vacancy_pct: number | null
        }
        ComputedFields: never
        Insert: {
          address: string
          alias?: string | null
          created_at?: string | null
          id?: string
          insurance?: number | null
          maintenance_pct?: number | null
          mgmt_pct?: number | null
          mortgage_payment?: number | null
          name?: string | null
          opex_inflation_rate?: number | null
          property_taxes?: number | null
          property_value?: number | null
          purchase_price?: number | null
          rent_growth_rate?: number | null
          sale_price?: number | null
          total_units?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          vacancy_pct?: number | null
        }
        Update: {
          address?: string
          alias?: string | null
          created_at?: string | null
          id?: string
          insurance?: number | null
          maintenance_pct?: number | null
          mgmt_pct?: number | null
          mortgage_payment?: number | null
          name?: string | null
          opex_inflation_rate?: number | null
          property_taxes?: number | null
          property_value?: number | null
          purchase_price?: number | null
          rent_growth_rate?: number | null
          sale_price?: number | null
          total_units?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
          vacancy_pct?: number | null
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
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
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
          user_id: string | null
        }
        ComputedFields: never
        Insert: {
          created_at?: string | null
          id?: string
          property_id: string
          unit_label: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          property_id?: string
          unit_label?: string
          updated_at?: string | null
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
          created_at: string | null
          id: string | null
          interest_rate: number | null
          loan_name: string | null
          monthly_payment: number | null
          name: string | null
          principal: number | null
          property_id: string | null
          start_date: string | null
          term_months: number | null
          updated_at: string | null
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
      confirm_mortgage_statement: {
        Args: { p_id: string; p_mortgage_id: string; p_statement_date: string; p_principal_balance: number; p_document_path: string }
        Returns: string
      }
      confirm_parsed_lease: {
        Args: {
          p_lease_id: string
          p_property_id: string
          p_unit_label: string
          p_tenant_name: string
          p_start_date: string
          p_end_date: string
          p_monthly_rent: number
          p_deposit: number | null
          p_late_fee: number | null
          p_grace_days: number | null
          p_notice_days: number | null
          p_doc_path: string
          p_parsed: Json
          p_confidence: Json
        }
        Returns: string
      }
      save_manual_lease: {
        Args: {
          p_lease_id: string
          p_edit: boolean
          p_property_id: string
          p_unit_label: string
          p_tenant_name: string
          p_start_date: string
          p_end_date: string
          p_monthly_rent: number
          p_deposit: number | null
          p_status: Database["public"]["Enums"]["lease_status"] | null
        }
        Returns: string
      }
      dealstack_add_lease: {
        Args: Omit<Database["public"]["Functions"]["save_manual_lease"]["Args"], "p_edit">
        Returns: string
      }
      update_property_unit_count: {
        Args: { target_property: string }
        Returns: number
      }
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
