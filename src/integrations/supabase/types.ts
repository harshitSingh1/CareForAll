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
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          severity: string
          user_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          severity: string
          user_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      case_assignments: {
        Row: {
          assignment_reason: string | null
          case_id: string
          created_at: string
          id: string
          is_fallback: boolean
          professional_id: string
          specialty: string
        }
        Insert: {
          assignment_reason?: string | null
          case_id: string
          created_at?: string
          id?: string
          is_fallback?: boolean
          professional_id: string
          specialty: string
        }
        Update: {
          assignment_reason?: string | null
          case_id?: string
          created_at?: string
          id?: string
          is_fallback?: boolean
          professional_id?: string
          specialty?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "submitted_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          message_type: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          message_type: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      check_ins: {
        Row: {
          created_at: string
          id: string
          journal: string | null
          mood: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          journal?: string | null
          mood: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          journal?: string | null
          mood?: string
          user_id?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          created_at: string
          id: string
          purpose: string | null
          scheduled_at: string
          specialty: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          purpose?: string | null
          scheduled_at: string
          specialty: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          purpose?: string | null
          scheduled_at?: string
          specialty?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          availability_status: string
          created_at: string
          full_name: string
          id: string
          is_verified: boolean
          qualification: string
          secondary_specialties: string[]
          specialty: string
          updated_at: string
          user_id: string
          years_of_experience: number
        }
        Insert: {
          availability_status?: string
          created_at?: string
          full_name: string
          id?: string
          is_verified?: boolean
          qualification: string
          secondary_specialties?: string[]
          specialty: string
          updated_at?: string
          user_id: string
          years_of_experience?: number
        }
        Update: {
          availability_status?: string
          created_at?: string
          full_name?: string
          id?: string
          is_verified?: boolean
          qualification?: string
          secondary_specialties?: string[]
          specialty?: string
          updated_at?: string
          user_id?: string
          years_of_experience?: number
        }
        Relationships: []
      }
      doctor_reviews: {
        Row: {
          ai_suggestion: string
          created_at: string
          doctor_reply: string | null
          id: string
          problem: string
          reviewed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          ai_suggestion: string
          created_at?: string
          doctor_reply?: string | null
          id?: string
          problem: string
          reviewed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          ai_suggestion?: string
          created_at?: string
          doctor_reply?: string | null
          id?: string
          problem?: string
          reviewed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      medical_documents: {
        Row: {
          created_at: string
          description: string | null
          document_date: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          hospital_name: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_date?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          hospital_name?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_date?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          hospital_name?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      medicine_doses: {
        Row: {
          created_at: string
          id: string
          medicine_id: string
          notes: string | null
          scheduled_at: string
          status: string
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          medicine_id: string
          notes?: string | null
          scheduled_at: string
          status?: string
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          medicine_id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medicine_doses_medicine_id_fkey"
            columns: ["medicine_id"]
            isOneToOne: false
            referencedRelation: "medicines"
            referencedColumns: ["id"]
          },
        ]
      }
      medicines: {
        Row: {
          created_at: string
          days_duration: number | null
          dosage: string | null
          end_date: string | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          schedule_times: string[]
          start_date: string
          times_per_day: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_duration?: number | null
          dosage?: string | null
          end_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          schedule_times?: string[]
          start_date?: string
          times_per_day?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_duration?: number | null
          dosage?: string | null
          end_date?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          schedule_times?: string[]
          start_date?: string
          times_per_day?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      selected_remedies: {
        Row: {
          id: string
          message_id: string
          remedy_text: string
          selected_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          remedy_text: string
          selected_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          remedy_text?: string
          selected_at?: string
          user_id?: string
        }
        Relationships: []
      }
      submitted_cases: {
        Row: {
          ai_response: string
          assigned_professional_id: string | null
          assigned_specialties: string[]
          assigned_specialty: string | null
          assignment_reason: string | null
          category: string
          created_at: string
          id: string
          is_ai_locked: boolean
          is_critical: boolean
          is_fallback_assignment: boolean
          medical_disclaimer: string | null
          message_id: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          selected_remedies: string[]
          status: string
          sub_category: string | null
          user_id: string
          user_issue: string
        }
        Insert: {
          ai_response: string
          assigned_professional_id?: string | null
          assigned_specialties?: string[]
          assigned_specialty?: string | null
          assignment_reason?: string | null
          category: string
          created_at?: string
          id?: string
          is_ai_locked?: boolean
          is_critical?: boolean
          is_fallback_assignment?: boolean
          medical_disclaimer?: string | null
          message_id: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selected_remedies: string[]
          status?: string
          sub_category?: string | null
          user_id: string
          user_issue: string
        }
        Update: {
          ai_response?: string
          assigned_professional_id?: string | null
          assigned_specialties?: string[]
          assigned_specialty?: string | null
          assignment_reason?: string | null
          category?: string
          created_at?: string
          id?: string
          is_ai_locked?: boolean
          is_critical?: boolean
          is_fallback_assignment?: boolean
          medical_disclaimer?: string | null
          message_id?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          selected_remedies?: string[]
          status?: string
          sub_category?: string | null
          user_id?: string
          user_issue?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_pins: {
        Row: {
          created_at: string
          id: string
          pin_hash: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pin_hash: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pin_hash?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          _action: string
          _max_requests?: number
          _user_id: string
          _window_minutes?: number
        }
        Returns: Json
      }
      cleanup_old_alerts: { Args: never; Returns: undefined }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "doctor" | "admin" | "advisor"
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
      app_role: ["user", "doctor", "admin", "advisor"],
    },
  },
} as const
