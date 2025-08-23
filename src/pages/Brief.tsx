import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { AudioPlayer } from "@/components/AudioPlayer";

type Brief = {
  id: string;
  mood: "focus" | "energy" | "calm";
  topics: string[] | null;
  duration_sec: number | null;
  status: "queued" | "summarizing" | "tts" | "music" | "mixing" | "uploading" | "ready" | "error";
  audio_url: string | null;
  script: string | null;
};

export default function BriefPage() {
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

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
      setLoading(false);
      // re-poll every 3s until not queued (or until ready/error)
      if (data.status && ["queued","summarizing","tts","music","mixing","uploading"].includes(data.status)) {
        timer = window.setTimeout(fetchBrief, 3000);
      }
    }
    fetchBrief();
    return () => { if (timer) window.clearTimeout(timer); };
  }, [id]);

  if (loading) return <div className="p-6 opacity-80">Loading brief…</div>;
  if (err) return <div className="p-6 text-red-300">Error: {err}</div>;
  if (!brief) return <div className="p-6">Brief not found.</div>;

  return (
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

        {brief.status === "ready" && brief.audio_url ? (
          <AudioPlayer audioUrl={brief.audio_url} />
        ) : brief.status === "error" ? (
          <div className="text-red-300">Generation failed.</div>
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
  );
}