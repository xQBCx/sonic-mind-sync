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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audio_segments: {
        Row: {
          audio_url: string | null
          brief_id: string
          created_at: string
          duration_sec: number | null
          id: string
          script: string | null
          segment_type: string
          sequence_order: number
          status: string | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          brief_id: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          script?: string | null
          segment_type: string
          sequence_order: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          brief_id?: string
          created_at?: string
          duration_sec?: number | null
          id?: string
          script?: string | null
          segment_type?: string
          sequence_order?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_segments_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      briefs: {
        Row: {
          audio_url: string | null
          background_music_url: string | null
          created_at: string | null
          duration_sec: number | null
          error_message: string | null
          flow_type: string | null
          id: string
          mood: string | null
          script: string | null
          segments: Json | null
          sound_effect_url: string | null
          status: string | null
          topics: string[] | null
          total_segments: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          audio_url?: string | null
          background_music_url?: string | null
          created_at?: string | null
          duration_sec?: number | null
          error_message?: string | null
          flow_type?: string | null
          id?: string
          mood?: string | null
          script?: string | null
          segments?: Json | null
          sound_effect_url?: string | null
          status?: string | null
          topics?: string[] | null
          total_segments?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          audio_url?: string | null
          background_music_url?: string | null
          created_at?: string | null
          duration_sec?: number | null
          error_message?: string | null
          flow_type?: string | null
          id?: string
          mood?: string | null
          script?: string | null
          segments?: Json | null
          sound_effect_url?: string | null
          status?: string | null
          topics?: string[] | null
          total_segments?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          id: string
          interests: string | null
          language_preference: string | null
          learning_goals: string | null
          origin: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          id?: string
          interests?: string | null
          language_preference?: string | null
          learning_goals?: string | null
          origin?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          id?: string
          interests?: string | null
          language_preference?: string | null
          learning_goals?: string | null
          origin?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      schedules: {
        Row: {
          created_at: string
          duration_sec: number
          id: string
          is_active: boolean | null
          label: string
          last_generated_at: string | null
          mood: string
          schedule_time: string
          timezone: string | null
          topics: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_sec?: number
          id?: string
          is_active?: boolean | null
          label: string
          last_generated_at?: string | null
          mood: string
          schedule_time: string
          timezone?: string | null
          topics?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_sec?: number
          id?: string
          is_active?: boolean | null
          label?: string
          last_generated_at?: string | null
          mood?: string
          schedule_time?: string
          timezone?: string | null
          topics?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          brief_id: string | null
          context: Json | null
          created_at: string
          event_type: string
          id: string
          session_duration_sec: number | null
          user_id: string
        }
        Insert: {
          brief_id?: string | null
          context?: Json | null
          created_at?: string
          event_type: string
          id?: string
          session_duration_sec?: number | null
          user_id: string
        }
        Update: {
          brief_id?: string | null
          context?: Json | null
          created_at?: string
          event_type?: string
          id?: string
          session_duration_sec?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_profile: {
        Args: {
          p_age?: number
          p_interests?: string
          p_language_preference?: string
          p_learning_goals?: string
          p_origin?: string
          p_user_id: string
        }
        Returns: undefined
      }
      track_user_event: {
        Args: {
          p_brief_id?: string
          p_context?: Json
          p_event_type: string
          p_session_duration_sec?: number
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
