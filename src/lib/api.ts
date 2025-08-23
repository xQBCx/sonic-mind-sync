// src/lib/api.ts
import { v4 as uuidv4 } from 'uuid';

const isMock =
  String(import.meta.env.VITE_MOCK ?? '1') === '1'  // default to on for safety
  || String(import.meta.env.MODE ?? '') === 'development';

type BriefStatus =
  | 'queued' | 'summarizing' | 'tts' | 'music' | 'mixing' | 'uploading' | 'ready' | 'error';

export type CreateBriefReq = {
  mood: 'focus'|'energy'|'calm';
  topics: string[];
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

  // REAL API path (kept as-is; adjust base URL/env as your app already does)
  const base = import.meta.env.VITE_API_URL;
  const res = await fetch(`${base}/api/briefs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`createBrief failed: ${res.status}`);
  return res.json();
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

  // REAL API path, with graceful fallback to mock if it errors
  try {
    const base = import.meta.env.VITE_API_URL;
    const res = await fetch(`${base}/api/briefs/${id}`);
    if (!res.ok) throw new Error(`getBrief failed: ${res.status}`);
    return res.json();
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