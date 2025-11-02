import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { briefId } = await req.json();
    if (!briefId) throw new Error("briefId required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openaiKey = Deno.env.get("OPENAI_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch brief
    const { data: brief, error: briefErr } = await supabase
      .from("briefs")
      .select("*")
      .eq("id", briefId)
      .single();

    if (briefErr || !brief) throw new Error("Brief not found");

    console.log(`[composer] Starting composition for brief ${briefId}`);

    // Update status
    await supabase
      .from("briefs")
      .update({ status: "tts", updated_at: new Date().toISOString() })
      .eq("id", briefId);

    // Step 1: Generate TTS voiceover
    console.log("[composer] Generating TTS voiceover...");
    const voiceoverAudio = await generateTTS(openaiKey, brief.script || "Welcome to your SonicBrief.");

    // Step 2: Skip loops for now to save memory (MVP)
    console.log("[composer] Skipping loop assets to conserve memory...");
    let loopBuffers: ArrayBuffer[] = [];

    // Step 3: Generate binaural beats
    console.log("[composer] Generating binaural beats...");
    await supabase
      .from("briefs")
      .update({ status: "mixing", updated_at: new Date().toISOString() })
      .eq("id", briefId);

    const binauralWav = generateBinauralWav(brief.mood || "focus", brief.duration_sec || 300);

    // Step 4: Simple mix (just concatenate/layer as WAV - simplified MVP)
    console.log("[composer] Mixing layers...");
    const mixedAudio = simpleMix(voiceoverAudio, loopBuffers, binauralWav);

    // Step 5: Upload to storage
    console.log("[composer] Uploading render...");
    await supabase
      .from("briefs")
      .update({ status: "uploading", updated_at: new Date().toISOString() })
      .eq("id", briefId);

    const renderPath = `${brief.user_id}/${briefId}.wav`;
    const { error: uploadErr } = await supabase.storage
      .from("renders")
      .upload(renderPath, mixedAudio, {
        contentType: "audio/wav",
        upsert: true,
      });

    if (uploadErr) throw uploadErr;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("renders")
      .getPublicUrl(renderPath);

    // Step 6: Update brief and create render record
    await supabase.from("renders").insert({
      brief_id: briefId,
      method: "composer:v0",
      url: urlData.publicUrl,
      diagnostics: {
        loops_used: loops?.map((l) => l.path) || [],
        duration_sec: brief.duration_sec,
        mood: brief.mood,
      },
    });

    await supabase
      .from("briefs")
      .update({
        status: "ready",
        audio_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", briefId);

    console.log("[composer] Composition complete!");

    return new Response(
      JSON.stringify({ success: true, audioUrl: urlData.publicUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[composer] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Generate TTS using OpenAI
async function generateTTS(apiKey: string, text: string): Promise<ArrayBuffer> {
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      input: text.slice(0, 4000), // Limit to 4k chars
      voice: "alloy",
      response_format: "wav",
      speed: 0.95, // Slightly slower for meditation-like feel
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`TTS failed: ${err}`);
  }

  return await response.arrayBuffer();
}

// Generate simple binaural sine waves
function generateBinauralWav(mood: string, durationSec: number): ArrayBuffer {
  const sampleRate = 16000; // Reduced from 48000 to save memory
  const numSamples = sampleRate * durationSec;
  
  // Carrier frequencies for binaural beats
  const baseFreq = 200;
  const deltaMap: Record<string, number> = {
    focus: 40,   // Beta waves
    energy: 15,  // High alpha
    calm: 8,     // Alpha waves
  };
  const delta = deltaMap[mood] || 40;
  
  const leftFreq = baseFreq;
  const rightFreq = baseFreq + delta;
  
  // Generate stereo PCM
  const dataSize = numSamples * 4; // 2 channels * 2 bytes per sample
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true);  // PCM
  view.setUint16(22, 2, true);  // stereo
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 4, true); // byte rate
  view.setUint16(32, 4, true);  // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  
  // Generate sine waves at low volume (-28 LUFS ≈ 0.04 amplitude)
  const amp = 0.04;
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const left = Math.sin(2 * Math.PI * leftFreq * t) * amp;
    const right = Math.sin(2 * Math.PI * rightFreq * t) * amp;
    
    view.setInt16(offset, left * 32767, true);
    view.setInt16(offset + 2, right * 32767, true);
    offset += 4;
  }
  
  return buffer;
}

// Simple mix: layer voiceover + loops + binaural
// MVP: just mix by averaging samples (no ducking, no mastering)
function simpleMix(
  voiceover: ArrayBuffer,
  loops: ArrayBuffer[],
  binaural: ArrayBuffer
): ArrayBuffer {
  // Parse WAV headers to get sample data
  const voPCM = extractPCM(voiceover);
  const loopsPCM = loops.map(extractPCM);
  const binPCM = extractPCM(binaural);
  
  // Find max length
  const maxLen = Math.max(
    voPCM.length,
    ...loopsPCM.map(l => l.length),
    binPCM.length
  );
  
  console.log(`[composer] Mixing ${maxLen} samples (${(maxLen / 16000 / 2).toFixed(1)}s)`);
  
  // Mix at fixed volumes: VO 100%, loops 40%, binaural 30%
  const mixed = new Int16Array(maxLen);
  
  for (let i = 0; i < maxLen; i++) {
    let sample = 0;
    
    // Voiceover at full volume
    if (i < voPCM.length) {
      sample += voPCM[i] * 1.0;
    }
    
    // Loops at 40%
    for (const loopPCM of loopsPCM) {
      if (i < loopPCM.length) {
        sample += loopPCM[i % loopPCM.length] * 0.4;
      }
    }
    
    // Binaural at 30%
    if (i < binPCM.length) {
      sample += binPCM[i] * 0.3;
    }
    
    // Soft clip to prevent distortion
    mixed[i] = Math.max(-32768, Math.min(32767, sample));
  }
  
  // Wrap in WAV
  return createWav(mixed, 16000, 2);
}

// Extract PCM samples from WAV
function extractPCM(wav: ArrayBuffer): Int16Array {
  const view = new DataView(wav);
  
  // Find data chunk (skip header)
  let offset = 12;
  while (offset < view.byteLength) {
    const chunkId = String.fromCharCode(
      view.getUint8(offset),
      view.getUint8(offset + 1),
      view.getUint8(offset + 2),
      view.getUint8(offset + 3)
    );
    const chunkSize = view.getUint32(offset + 4, true);
    
    if (chunkId === "data") {
      const numSamples = chunkSize / 2;
      const pcm = new Int16Array(numSamples);
      let pcmOffset = offset + 8;
      for (let i = 0; i < numSamples; i++) {
        pcm[i] = view.getInt16(pcmOffset, true);
        pcmOffset += 2;
      }
      return pcm;
    }
    
    offset += 8 + chunkSize;
  }
  
  return new Int16Array(0);
}

// Create WAV from PCM
function createWav(pcm: Int16Array, sampleRate: number = 16000, channels: number = 2): ArrayBuffer {
  const dataSize = pcm.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * channels * 2, true);
  view.setUint16(32, channels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);
  
  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    view.setInt16(offset, pcm[i], true);
    offset += 2;
  }
  
  return buffer;
}
