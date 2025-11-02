// src/lib/api.ts
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

const isMock = false; // Use real Supabase backend

type BriefStatus =
  | 'queued' | 'summarizing' | 'tts' | 'music' | 'mixing' | 'uploading' | 'ready' | 'error';

export type CreateBriefReq = {
  mood: string;
  topics?: string[]; // Legacy support
  instructions?: string; // New preferred field
  durationSec: number;
};
export type Brief = {
  id: string;
  status: BriefStatus;
  audioUrl?: string;
  script?: string;
  mood: string;
  topics: string[];
  durationSec: number;
  error?: string;
  createdAt?: number;
};

const LS_KEY = 'sb_mock_briefs_v1';
function loadStore(): Record<string, Brief & { startAt?: number }> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function saveStore(store: Record<string, Brief & { startAt?: number }>) {
  localStorage.setItem(LS_KEY, JSON.stringify(store));
}
function advance(b: Brief & { startAt?: number }): Brief {
  // Simulate ~10s pipeline with stages
  const TOTAL = 10000;
  const STAGES: [BriefStatus, number][] = [
    ['queued', 0],
    ['summarizing', 2000],
    ['tts', 4000],
    ['music', 6000],
    ['mixing', 8000],
    ['uploading', 9000],
    ['ready', TOTAL],
  ];
  const now = Date.now();
  const start = b.startAt ?? now;
  const elapsed = now - start;
  let status: BriefStatus = 'queued';
  for (const [s, t] of STAGES) if (elapsed >= t) status = s;

  const next: Brief = {
    ...b,
    status,
    audioUrl: status === 'ready' ? '/sample.mp3' : b.audioUrl,
    script: b.script ?? (status === 'ready' ? 'This is a demo script for your SonicBrief.' : undefined),
  };
  (next as any).startAt = start;
  return next;
}

export async function createBrief(req: CreateBriefReq): Promise<{ briefId: string; status: BriefStatus }> {
  if (isMock) {
    const id = uuidv4();
    const store = loadStore();
    store[id] = {
      id,
      mood: req.mood,
      topics: req.topics,
      durationSec: req.durationSec,
      status: 'queued',
      createdAt: Date.now(),
      startAt: Date.now(),
    };
    saveStore(store);
    return { briefId: id, status: 'queued' };
  }

  // Check authentication before making the request
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated. Please sign in to generate a brief.');
  }

  // invoke edge function; supabase client auto-attaches the user's JWT
  const { data, error } = await supabase.functions.invoke("generate-brief-openai", {
    body: req,
  });
  
  if (error) {
    console.error('Edge function error:', error);
    throw new Error(`Failed to generate brief: ${error.message}`);
  }
  
  // data should be { briefId, status }
  return data;
}

export async function getBrief(id: string): Promise<Brief> {
  if (isMock) {
    const store = loadStore();
    const found = store[id];
    if (!found) throw new Error('Mock brief not found');
    const advanced = advance(found);
    store[id] = advanced as any;
    saveStore(store);
    return advanced;
  }

  // Check authentication before making the request
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('User not authenticated. Please sign in to view briefs.');
  }

  // Query the brief from Supabase
  try {
    const { data: brief, error } = await supabase
      .from('briefs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch brief: ${error.message}`);
    }

    if (!brief) {
      throw new Error('Brief not found');
    }

    // Convert database format to API format
    return {
      id: brief.id,
      status: brief.status as BriefStatus,
      audioUrl: brief.audio_url || undefined,
      script: brief.script || undefined,
      mood: brief.mood,
      topics: brief.topics,
      durationSec: brief.duration_sec,
      error: brief.error_message || undefined,
      createdAt: new Date(brief.created_at).getTime(),
    };
  } catch (e) {
    // Fallback: if VITE_MOCK=1 at build time, use mock progression
    if (String(import.meta.env.VITE_MOCK ?? '') === '1') {
      const store = loadStore();
      const fallback: Brief = store[id] ? advance(store[id]) : {
        id, mood: 'focus', topics: ['starter'], durationSec: 120,
        status: 'ready', audioUrl: '/sample.mp3', script: 'Fallback mock script.',
      };
      store[id] = fallback as any;
      saveStore(store);
      return fallback;
    }
    throw e;
  }
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
  try {
    const stored = localStorage.getItem('sonicbrief_history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Mock audio generation API
export async function generateAudio(params: { genre: string; mood: string; text: string; voice: string }) {
  // Simulate API delay
  await new Promise(r => setTimeout(r, 3000));
  
  // Return placeholder audio file
  return { url: "/sample.mp3" };
}