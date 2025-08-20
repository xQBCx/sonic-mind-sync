import { createClient } from "@supabase/supabase-js";

// TODO: replace these strings with your actual values
const SUPABASE_URL = "https://ldcofddghsruqarlgagh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkY29mZGRnaHNydXFhcmxnYWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3MjQ4MTUsImV4cCI6MjA3MTMwMDgxNX0.TuoRHeBuDkCH4cAJNx4wX9fO_YIz1kl1RyFNwIe2nXE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export type Database = {
  public: {
    Tables: {
      briefs: {
        Row: {
          id: string
          user_id: string
          mood: 'focus' | 'energy' | 'calm'
          topics: string[]
          duration_sec: number
          status: 'queued' | 'summarizing' | 'tts' | 'music' | 'mixing' | 'uploading' | 'ready' | 'error'
          audio_url: string | null
          script: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          mood: 'focus' | 'energy' | 'calm'
          topics: string[]
          duration_sec: number
          status?: 'queued'
          audio_url?: string | null
          script?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          mood?: 'focus' | 'energy' | 'calm'
          topics?: string[]
          duration_sec?: number
          status?: 'queued' | 'summarizing' | 'tts' | 'music' | 'mixing' | 'uploading' | 'ready' | 'error'
          audio_url?: string | null
          script?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}