// Bu fayl avtomatik generatsiya qilingan (Supabase MCP: generate_typescript_types).
// Qo'lda tahrirlamang — sxema o'zgarsa qayta generatsiya qiling.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          audio_path: string | null
          created_at: string
          flag: string | null
          id: string
          is_edited: boolean
          question_id: string
          session_id: string
          skipped: boolean
          text: string | null
          transcript: string | null
          updated_at: string
        }
        Insert: {
          audio_path?: string | null
          created_at?: string
          flag?: string | null
          id?: string
          is_edited?: boolean
          question_id: string
          session_id: string
          skipped?: boolean
          text?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          audio_path?: string | null
          created_at?: string
          flag?: string | null
          id?: string
          is_edited?: boolean
          question_id?: string
          session_id?: string
          skipped?: boolean
          text?: string | null
          transcript?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          id: number
          payload: Json | null
          session_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: number
          payload?: Json | null
          session_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          id?: number
          payload?: Json | null
          session_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_blocks: {
        Row: {
          code: string
          description: string | null
          id: string
          order_index: number
          questionnaire_id: string
          title: string
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          order_index: number
          questionnaire_id: string
          title: string
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          order_index?: number
          questionnaire_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_blocks_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      questionnaires: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          title: string
          version: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title: string
          version?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          title?: string
          version?: number
        }
        Relationships: []
      }
      questions: {
        Row: {
          allow_voice: boolean
          block_id: string
          hint: string | null
          id: string
          is_key: boolean
          is_required: boolean
          number: number
          options: Json | null
          order_index: number
          probes: Json | null
          text: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Insert: {
          allow_voice?: boolean
          block_id: string
          hint?: string | null
          id?: string
          is_key?: boolean
          is_required?: boolean
          number: number
          options?: Json | null
          order_index: number
          probes?: Json | null
          text: string
          type: Database["public"]["Enums"]["question_type"]
        }
        Update: {
          allow_voice?: boolean
          block_id?: string
          hint?: string | null
          id?: string
          is_key?: boolean
          is_required?: boolean
          number?: number
          options?: Json | null
          order_index?: number
          probes?: Json | null
          text?: string
          type?: Database["public"]["Enums"]["question_type"]
        }
        Relationships: [
          {
            foreignKeyName: "questions_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "question_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      respondents: {
        Row: {
          children_count: number | null
          created_at: string
          full_name: string
          id: string
          notes: string | null
          org_name: string | null
          org_type: Database["public"]["Enums"]["org_type"]
          phone: string | null
          telegram_user_id: number | null
        }
        Insert: {
          children_count?: number | null
          created_at?: string
          full_name: string
          id?: string
          notes?: string | null
          org_name?: string | null
          org_type?: Database["public"]["Enums"]["org_type"]
          phone?: string | null
          telegram_user_id?: number | null
        }
        Update: {
          children_count?: number | null
          created_at?: string
          full_name?: string
          id?: string
          notes?: string | null
          org_name?: string | null
          org_type?: Database["public"]["Enums"]["org_type"]
          phone?: string | null
          telegram_user_id?: number | null
        }
        Relationships: []
      }
      session_summaries: {
        Row: {
          ai_generated_at: string | null
          ai_summary: Json | null
          biggest_pain: string | null
          current_solution: string | null
          hours_per_month: number | null
          hypothesis_confirmed: string | null
          money_lost_12m: number | null
          paid_before: boolean | null
          paid_before_amount: number | null
          referral_ok: boolean | null
          session_id: string
          surprise: string | null
          telegram_group: string | null
          updated_at: string
        }
        Insert: {
          ai_generated_at?: string | null
          ai_summary?: Json | null
          biggest_pain?: string | null
          current_solution?: string | null
          hours_per_month?: number | null
          hypothesis_confirmed?: string | null
          money_lost_12m?: number | null
          paid_before?: boolean | null
          paid_before_amount?: number | null
          referral_ok?: boolean | null
          session_id: string
          surprise?: string | null
          telegram_group?: string | null
          updated_at?: string
        }
        Update: {
          ai_generated_at?: string | null
          ai_summary?: Json | null
          biggest_pain?: string | null
          current_solution?: string | null
          hours_per_month?: number | null
          hypothesis_confirmed?: string | null
          money_lost_12m?: number | null
          paid_before?: boolean | null
          paid_before_amount?: number | null
          referral_ok?: boolean | null
          session_id?: string
          surprise?: string | null
          telegram_group?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_summaries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_question: number | null
          id: string
          mode: Database["public"]["Enums"]["session_mode"]
          questionnaire_id: string
          respondent_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["session_status"]
          token: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_question?: number | null
          id?: string
          mode?: Database["public"]["Enums"]["session_mode"]
          questionnaire_id: string
          respondent_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          token: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_question?: number | null
          id?: string
          mode?: Database["public"]["Enums"]["session_mode"]
          questionnaire_id?: string
          respondent_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_respondent_id_fkey"
            columns: ["respondent_id"]
            isOneToOne: false
            referencedRelation: "respondents"
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
      org_type: "subsidized" | "non_subsidized" | "unknown" | "other"
      question_type:
        | "text_short"
        | "text_long"
        | "number"
        | "money"
        | "yes_no"
        | "single_choice"
        | "multi_choice"
      session_mode: "self" | "interviewer"
      session_status: "created" | "in_progress" | "completed" | "abandoned"
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
      org_type: ["subsidized", "non_subsidized", "unknown", "other"],
      question_type: [
        "text_short",
        "text_long",
        "number",
        "money",
        "yes_no",
        "single_choice",
        "multi_choice",
      ],
      session_mode: ["self", "interviewer"],
      session_status: ["created", "in_progress", "completed", "abandoned"],
    },
  },
} as const
