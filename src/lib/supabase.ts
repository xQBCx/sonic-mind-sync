import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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