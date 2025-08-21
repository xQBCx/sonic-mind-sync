import { supabase } from "@/lib/supabase";

type Mood = "focus" | "energy" | "calm";

export async function createBrief(params: { mood: Mood; topics: string[]; duration_sec: number }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in");
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
    .single();
  if (error) throw error;
  return data.id as string;
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