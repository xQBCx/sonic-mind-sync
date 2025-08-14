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
  const briefId = crypto.randomUUID();
  
  if (MOCK_MODE) {
    // Store mock brief with progression timing
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

  try {
    const response = await fetch(`${API_URL}/api/briefs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API error, falling back to mock mode:', error);
    // Fallback to mock mode
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
}

export async function getBrief(id: string): Promise<GetBriefResponse> {
  if (MOCK_MODE || mockBriefs[id]) {
    const mockBrief = mockBriefs[id];
    if (!mockBrief) {
      throw new Error('Brief not found');
    }

    const elapsed = Date.now() - mockBrief.startTime;
    const progressSteps = Math.floor(elapsed / 2000); // Progress every 2 seconds
    const currentStatusIndex = Math.min(progressSteps, statusProgression.length - 1);
    const status = statusProgression[currentStatusIndex];

    if (status === 'ready') {
      return {
        status: 'ready',
        audioUrl: '/sample.mp3', // We'll create this
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

  try {
    const response = await fetch(`${API_URL}/api/briefs/${id}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API error:', error);
    throw error;
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

export function saveBriefToHistory(brief: BriefHistoryItem) {
  const history = getBriefHistory();
  const updated = [brief, ...history.filter(h => h.id !== brief.id)].slice(0, 10);
  localStorage.setItem('sonicbrief_history', JSON.stringify(updated));
}

export function getBriefHistory(): BriefHistoryItem[] {
  try {
    const stored = localStorage.getItem('sonicbrief_history');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}