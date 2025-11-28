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
          {
            foreignKeyName: "fk_audio_segments_brief_id"
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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: []
      }
      loop_assets: {
        Row: {
          bpm: number | null
          created_at: string | null
          duration_sec: number
          id: string
          key: string | null
          license: string
          mood: string[]
          path: string
          sha256: string
          type: string
        }
        Insert: {
          bpm?: number | null
          created_at?: string | null
          duration_sec: number
          id?: string
          key?: string | null
          license: string
          mood: string[]
          path: string
          sha256: string
          type: string
        }
        Update: {
          bpm?: number | null
          created_at?: string | null
          duration_sec?: number
          id?: string
          key?: string | null
          license?: string
          mood?: string[]
          path?: string
          sha256?: string
          type?: string
        }
        Relationships: []
      }
      personalization_insights: {
        Row: {
          confidence_score: number | null
          created_at: string
          id: string
          insight_data: Json
          insight_type: string
          last_updated: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          insight_data: Json
          insight_type: string
          last_updated?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          id?: string
          insight_data?: Json
          insight_type?: string
          last_updated?: string
          user_id?: string
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
      renders: {
        Row: {
          brief_id: string | null
          created_at: string | null
          diagnostics: Json | null
          id: string
          method: string
          peak_db: number | null
          url: string
        }
        Insert: {
          brief_id?: string | null
          created_at?: string | null
          diagnostics?: Json | null
          id?: string
          method?: string
          peak_db?: number | null
          url: string
        }
        Update: {
          brief_id?: string | null
          created_at?: string | null
          diagnostics?: Json | null
          id?: string
          method?: string
          peak_db?: number | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "renders_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
        ]
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
      testimonials: {
        Row: {
          created_at: string
          id: string
          is_approved: boolean | null
          testimonial_text: string
          updated_at: string
          user_email: string
          user_name: string | null
          user_title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          testimonial_text: string
          updated_at?: string
          user_email: string
          user_name?: string | null
          user_title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_approved?: boolean | null
          testimonial_text?: string
          updated_at?: string
          user_email?: string
          user_name?: string | null
          user_title?: string | null
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
      user_interaction_logs: {
        Row: {
          brief_id: string | null
          created_at: string
          id: string
          interaction_type: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          brief_id?: string | null
          created_at?: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          brief_id?: string | null
          created_at?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interaction_logs_brief_id_fkey"
            columns: ["brief_id"]
            isOneToOne: false
            referencedRelation: "briefs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_learning_preferences: {
        Row: {
          created_at: string
          difficulty_preference: string | null
          favorite_topics: string[] | null
          id: string
          learning_style: string | null
          music_preferences: Json | null
          preferred_duration_sec: number | null
          preferred_mood: string | null
          time_of_day_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_preference?: string | null
          favorite_topics?: string[] | null
          id?: string
          learning_style?: string | null
          music_preferences?: Json | null
          preferred_duration_sec?: number | null
          preferred_mood?: string | null
          time_of_day_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_preference?: string | null
          favorite_topics?: string[] | null
          id?: string
          learning_style?: string | null
          music_preferences?: Json | null
          preferred_duration_sec?: number | null
          preferred_mood?: string | null
          time_of_day_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
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
      admin_get_users_with_roles: {
        Args: never
        Returns: {
          approved_at: string
          approved_by: string
          created_at: string
          email: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }[]
      }
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
      get_platform_stats: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
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
      track_user_interaction: {
        Args: {
          p_brief_id?: string
          p_interaction_type: string
          p_metadata?: Json
          p_user_id: string
        }
        Returns: undefined
      }
      update_user_learning_preferences: {
        Args: {
          p_difficulty_preference?: string
          p_favorite_topics?: string[]
          p_learning_style?: string
          p_music_preferences?: Json
          p_preferred_duration_sec?: number
          p_preferred_mood?: string
          p_time_of_day_preference?: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "pending"
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
      app_role: ["admin", "user", "pending"],
    },
  },
} as const
