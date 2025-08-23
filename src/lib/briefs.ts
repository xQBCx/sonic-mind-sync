import { supabase } from "@/lib/supabase";

type Mood = "focus" | "energy" | "calm";

export async function createBrief(params: {
  mood: Mood;
  topics: string[];
  duration_sec: number;
}) {
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr) throw uerr;
  if (!user) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from("briefs")
    .insert({
      user_id: user.id,
      mood: params.mood,
      topics: params.topics,
      duration_sec: params.duration_sec,
      status: "queued",
    })
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Failed to create brief");
  const id = data.id as string;

  // Start mock progression if in mock mode
  if (import.meta.env.VITE_MOCK === '1') {
    // fire-and-forget; no await so UI keeps moving
    simulateBriefProgress(id);
  }

  return { briefId: id };
}

// Mock-only status progression (runs in the background)
export async function simulateBriefProgress(briefId: string) {
  if (import.meta.env.VITE_MOCK !== '1') return;
  const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
  const steps: Array<{status: string; delay: number}> = [
    { status: 'summarizing', delay: 2000 },
    { status: 'tts',         delay: 2000 },
    { status: 'music',       delay: 1500 },
    { status: 'mixing',      delay: 1500 },
    { status: 'uploading',   delay: 1000 },
  ];
  for (const s of steps) {
    await sleep(s.delay);
    await supabase.from('briefs')
      .update({ status: s.status as any, updated_at: new Date().toISOString() })
      .eq('id', briefId);
  }
  // Finalize
  await supabase.from('briefs')
    .update({
      status: 'ready' as any,
      audio_url: '/sample.mp3',
      script: 'Sample mock script for demo.',
      updated_at: new Date().toISOString()
    })
    .eq('id', briefId);
}

export async function listMyBriefs(limit = 10) {
  const { data: { user }, error: uerr } = await supabase.auth.getUser();
  if (uerr) throw uerr;
  if (!user) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from("briefs")
    .select("id, mood, topics, duration_sec, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  return data;
}

// TEMP: simulate the pipeline, then mark as ready with sample audio
export async function mockProcessBrief(id: string) {
  await new Promise((r) => setTimeout(r, 10000));
  const { error } = await supabase
    .from("briefs")
    .update({
      status: "ready",
      audio_url: "/sample.mp3",
      script: "Demo script: your SonicBrief is ready (mock).",
    })
    .eq("id", id);
  if (error) throw error;
}