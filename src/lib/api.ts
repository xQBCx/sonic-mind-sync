import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'https://sonicbrief-api.example.com';
const MOCK_MODE = import.meta.env.VITE_MOCK === '1' || !import.meta.env.VITE_API_URL;

export interface CreateBriefRequest {
  mood: 'focus' | 'energy' | 'calm';
  topics: string[];
  durationSec: number;
}

export interface CreateBriefResponse {
  briefId: string;
  status: 'queued';
}

export interface GetBriefResponse {
  status: 'queued' | 'summarizing' | 'tts' | 'music' | 'mixing' | 'uploading' | 'ready' | 'error';
  audioUrl?: string;
  script?: string;
  mood: string;
  topics: string[];
  durationSec: number;
  error?: string;
}

// Mock data for demo
const mockBriefs: Record<string, GetBriefResponse & { createdAt: Date; startTime: number }> = {};

const statusProgression = ['queued', 'summarizing', 'tts', 'music', 'mixing', 'uploading', 'ready'] as const;

export async function createBrief(request: CreateBriefRequest): Promise<CreateBriefResponse> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('User must be authenticated')
  }

  const briefId = crypto.randomUUID();
  
  // Always use Supabase now
  const { data, error } = await supabase
    .from('briefs')
    .insert({
      id: briefId,
      user_id: user.id,
      mood: request.mood,
      topics: request.topics,
      duration_sec: request.durationSec,
      status: 'queued'
    })
    .select()
    .single()

  if (error) {
    console.error('Supabase error:', error)
    // Fallback to mock mode if Supabase fails
    mockBriefs[briefId] = {
      status: 'queued',
      mood: request.mood,
      topics: request.topics,
      durationSec: request.durationSec,
      createdAt: new Date(),
      startTime: Date.now()
    };
    
    return { briefId, status: 'queued' };
  }

  return { briefId: data.id, status: 'queued' };
}

export async function getBrief(id: string): Promise<GetBriefResponse> {
  // Check if it's a mock brief first
  if (mockBriefs[id]) {
    const mockBrief = mockBriefs[id];
    const elapsed = Date.now() - mockBrief.startTime;
    const progressSteps = Math.floor(elapsed / 2000);
    const currentStatusIndex = Math.min(progressSteps, statusProgression.length - 1);
    const status = statusProgression[currentStatusIndex];

    if (status === 'ready') {
      return {
        status: 'ready',
        audioUrl: '/sample.mp3',
        script: `This is your ${mockBrief.mood} brief on ${mockBrief.topics.join(', ')}. Here's what you need to know to optimize your cognitive performance today...`,
        mood: mockBrief.mood,
        topics: mockBrief.topics,
        durationSec: mockBrief.durationSec
      };
    }

    return {
      status,
      mood: mockBrief.mood,
      topics: mockBrief.topics,
      durationSec: mockBrief.durationSec
    };
  }

  // Try Supabase first
  const { data, error } = await supabase
    .from('briefs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Supabase error:', error)
    throw new Error('Brief not found')
  }

  return {
    status: data.status,
    audioUrl: data.audio_url || undefined,
    script: data.script || undefined,
    mood: data.mood,
    topics: data.topics,
    durationSec: data.duration_sec,
    error: data.error_message || undefined
  };
}

// History management (localStorage for MVP)
export interface BriefHistoryItem {
  id: string;
  mood: string;
  topics: string[];
  durationSec: number;
  createdAt: string;
  status: string;
}

export async function saveBriefToHistory(brief: BriefHistoryItem) {
  const history = await getBriefHistory();
  const updated = [brief, ...history.filter(h => h.id !== brief.id)].slice(0, 10);
  localStorage.setItem('sonicbrief_history', JSON.stringify(updated));
}

export async function getBriefHistory(): Promise<BriefHistoryItem[]> {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Fallback to localStorage for unauthenticated users
    try {
      const stored = localStorage.getItem('sonicbrief_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  const { data, error } = await supabase
    .from('briefs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching history:', error)
    return []
  }

  return data.map(brief => ({
    id: brief.id,
    mood: brief.mood,
    topics: brief.topics,
    durationSec: brief.duration_sec,
    createdAt: brief.created_at,
    status: brief.status
  }))
}