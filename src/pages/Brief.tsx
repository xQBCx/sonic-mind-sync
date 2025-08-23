import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/AudioPlayer";
import { MultiSegmentAudioPlayer } from "@/components/MultiSegmentAudioPlayer";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/Header";
import { Loader2 } from "lucide-react";

interface AudioSegment {
  id: string;
  segment_type: 'intro_music' | 'affirmation' | 'content' | 'outro' | 'ambient';
  sequence_order: number;
  audio_url?: string;
  script?: string;
  duration_sec?: number;
  status: 'pending' | 'generating' | 'ready' | 'error';
}

type Brief = {
  id: string;
  mood: string;
  topics: string[] | null;
  duration_sec: number | null;
  status: string;
  audio_url: string | null;
  script: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  flow_type?: 'single' | 'morning' | 'midday' | 'study' | 'winddown';
  background_music_url?: string;
  total_segments?: number;
};

export default function BriefPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [segments, setSegments] = useState<AudioSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirectTo=' + encodeURIComponent(`/brief/${id}`));
    }
  }, [user, authLoading, navigate, id]);

  const moodColor = useMemo(() => {
    switch (brief?.mood) {
      case "focus": return "bg-blue-500/20 text-blue-300";
      case "energy": return "bg-orange-500/20 text-orange-300";
      case "calm": return "bg-purple-500/20 text-purple-300";
      default: return "bg-white/10 text-white/80";
    }
  }, [brief?.mood]);

  useEffect(() => {
    let timer: number | undefined;
    async function fetchBrief() {
      if (!id) return;
      const { data, error } = await supabase
        .from("briefs")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) { setErr(error.message); setLoading(false); return; }
      if (!data) { setErr("Brief not found"); setLoading(false); return; }
      setBrief(data as Brief);

      // Fetch segments if this is a multi-segment brief
      if (data.total_segments && data.total_segments > 1) {
        const { data: segmentData, error: segmentError } = await supabase
          .from('audio_segments')
          .select('*')
          .eq('brief_id', id)
          .order('sequence_order');

        if (!segmentError && segmentData) {
          setSegments(segmentData as AudioSegment[]);
        }
      }

      setLoading(false);
      // re-poll every 3s until not queued (or until ready/error)
      if (data.status && ["queued","summarizing","tts","music","mixing","uploading"].includes(data.status)) {
        timer = window.setTimeout(fetchBrief, 3000);
      }
    }
    fetchBrief();
    return () => { if (timer) window.clearTimeout(timer); };
  }, [id, user]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <div className="p-6 opacity-80">Loading brief…</div>
    </div>
  );
  
  if (err) return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <div className="p-6 text-red-300">Error: {err}</div>
    </div>
  );
  
  if (!brief) return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <div className="p-6">Brief not found.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-background">
      <Header />
      <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Badge className={moodColor}>{brief.mood}</Badge>
        <span className="opacity-70">{brief.duration_sec ? `${Math.round(brief.duration_sec/60)} min` : ""}</span>
      </div>

      {brief.topics?.length ? (
        <div className="flex flex-wrap gap-2">
          {brief.topics.map((t) => (
            <Badge key={t} variant="secondary" className="bg-white/10">{t}</Badge>
          ))}
        </div>
      ) : null}

      <div className="rounded-xl p-5 bg-white/5">
        <div className="mb-3">
          <Badge>{brief.status}</Badge>
        </div>

        {brief.status === "ready" ? (
          brief.total_segments && brief.total_segments > 1 ? (
            <MultiSegmentAudioPlayer 
              segments={segments}
              title="Your SonicBrief"
              flowType={brief.flow_type}
              backgroundMusicUrl={brief.background_music_url}
            />
          ) : brief.audio_url ? (
            <AudioPlayer audioUrl={brief.audio_url} />
          ) : (
            <div className="text-muted-foreground">No audio content available</div>
          )
        ) : brief.status === "error" ? (
          <div className="text-red-300">
            Generation failed: {brief.error_message || 'Unknown error'}
          </div>
        ) : (
          <div className="opacity-70">Your brief is being prepared…</div>
        )}
      </div>

      {brief.script ? (
        <details className="rounded-xl p-4 bg-white/5">
          <summary className="cursor-pointer font-medium">View script</summary>
          <p className="mt-3 whitespace-pre-wrap opacity-90">{brief.script}</p>
        </details>
      ) : null}
      </div>
    </div>
  );
}